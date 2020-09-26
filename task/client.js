import {split, single, iterate, join} from '../src/encoding.js';
import {deexpando, expando} from '../src/expando.js';
import * as helper from '../src/helper.js';
import {
  unicode11,
  unicode12,
  unicode13,
} from '../src/raw/defs.js';
import {
  getPersonConfig,
  splitForModifiers,
  joinForModifiers,
  isGroup,
  isModifierBase,
} from '../src/modifier.js';

export {default as determineEmojiSupport} from '../src/version.js';

const buildStringHas = (source) => {
  const data = split(source).map(single);
  const s = /** @type {!Set<string>} */ (new Set(data));
  return (check) => s.has(check);
};

const unicode11Has = buildStringHas(unicode11);
const unicode12Has = buildStringHas(unicode12);
const unicode13Has = buildStringHas(unicode13);

/**
 * Denormalizes server emoji for client based on the current Unicode version. This can modify or
 * even clear the incoming emoji completely, returning an empty string.
 *
 * The server will never send us skin tones. It can send us gendered emoji, which we must display.
 *
 * @param {string} raw
 * @param {number} version
 * @return {?Array<string>} output options (could be empty), or null for use raw
 */
export function restoreForClient(raw, version=0) {
  const genderSlots = [];
  let change = false;

  const rewriter = (part) => {
    if (deexpando(part)) {
      change = true;
      return part;  // all expandos result in ancient valid emoji
    }
    if (version >= 140 || version === 0) {
      return part;
    }

    // TODO: fix this by config _then_ unicodeHas
    // const result = splitForModifiers(part);
    // if (result !== null) {
    //   const {base} = result;
    //   const config = getPersonConfig(base);
    //   if (config !== null) {

    //     if (version < config.n) {
          
    //     }

    //   }
    // }

    if (part.length === 2 && part[0] === helper.runePerson) {
      switch (part[1]) {
        case helper.runeHolidayTree:
          if (version >= 130) {
            return part;
          }
          // "MX CLAUS" to f or m
          genderSlots.push([0x1f936, 0x1f385]);
          change = true;
          return [-1];

        case helper.runeMusicalNotes:
          // "DANCER" to f or m
          genderSlots.push([0x1f483, 0x1f57a]);
          change = true;
          return [-1];

        case helper.runeCrown:
          // "ROYALTY" to f or m
          genderSlots.push([0x1f478, 0x1f934]);
          change = true;
          return [-1];
      }

      // gendered hair supported only in 121 (hair from 110)
      if (version < 121 && helper.isHairEmoji(part[1])) {
        if (version < 110) {
          return null;  // no hair emoji supported
        }
        change = true;
        genderSlots.push([helper.runePersonWoman, helper.runePersonMan]);
        return [-1, part[1]];
      }
    }

    const s = single(part);  // TODO: check ZWJ instead?

    // TODO: we merge 13 and 13.1, but it's only for ZWJ'ed stuff, should we check in client?
    if (version >= 130) {
      return part;
    } else if (unicode13Has(s)) {
      return null;
    }

    // TODO: we treat 12.1 as minimum 12.x support
    if (version >= 121) {
      return part;
    }

    // TODO: E12.1 added a ton of gendered folks, should only include from there

    // neutral "PEOPLE HOLDING HANDS" added in 12.0
    if (part.length === 3 && part[0] === helper.runePerson && part[1] === helper.runeHandshake && part[2] === helper.runePerson) {
      change = true;
      return [0x1f46b];  // use "WOMAN AND MAN HOLDING HANDS", too hard otherwise
    }
    if (unicode12Has(s)) {
      return null;
    }

    if (version >= 110) {
      return part;
    } else if (unicode11Has(s)) {
      return null;
    }

    // give up < E11.0
    return part;
  };

  let work = split(raw).map(rewriter);
  if (!change && work.indexOf(null) === -1 && genderSlots.length === 0) {
    return null;  // nothing actually changed
  }

  work = work.filter((x) => x !== null);
  if (work.length === 0) {
    return [];
  } else if (genderSlots.length === 0) {
    return [join(work)];
  }

  const options = [[], []];
  for (const part of work) {
    if (part[0] !== -1) {
      options[0].push(part);
      options[1].push(part);
      continue;
    }
    part.shift();
    const slot = genderSlots.shift();
    options[0].push([slot[0], ...part])
    options[1].push([slot[1], ...part])
  }
  return options.map(join);
}


/**
 * @param {string} raw
 * @param {number} version
 * @return {!Object<string, string>}
 */
export function genderVariants(raw, version=0) {
  const build = (part) => {
    part = part.slice();  // since we expando but store later
    expando(part);
    const split = splitForModifiers(part);
    if (split === null) {
      return null;
    }

    const {gender, base} = split;
    if (gender === -1) {
      return null;
    }

    const config = getPersonConfig(base);
    if (config === null || version !== 0 && version < config.g) {
      return null;
    }

    const out = {
      'f': joinForModifiers({...split, gender: helper.runeGenderFemale}),
      'm': joinForModifiers({...split, gender: helper.runeGenderMale}),
    };

    if (version === 0 || version >= config.n) {
      out['n'] = joinForModifiers({...split, gender: 0});
    }

    if (isGroup(base)) {
      out['c'] = joinForModifiers({...split, gender: helper.runeGenderFauxBoth});

      for (const k in out) {
        deexpando(out[k]);
      }
      return out;
    }

    if (deexpando(out['f'])) {
      deexpando(out['m']);  // only deexpando man if we have to, no neutral single here
    }

    return out;
  };

  const empty = {};
  const uniques = new Set();
  const all = [];
  for (const part of iterate(raw)) {
    const out = build(part) || empty;
    for (const option in out) {
      uniques.add(option);
    }
    all.push({part, out});
  }

  if (!uniques.size) {
    return {};
  }

  const uniqueArray = [...uniques];
  uniqueArray.sort();

  const final = {};
  uniqueArray.forEach((each) => final[each] = []);

  for (const {part, out} of all) {
    uniqueArray.forEach((each) => {
      final[each].push(out[each] || part);
    });
  }

  const s = {};
  uniqueArray.forEach((each) => s[each] = join(final[each]));
  return s;
}


function internalBaseToneSupport(base, version, tone, extraTone) {
  if (tone === -1) {
    return 0;
  }

  if (base === helper.runeHandshake) {
    if (version !== 0 && version < 121) {
      return 0;  // "PEOPLE HOLDING HANDS" only supports tone in 121
    }
    return 2;
  } else if (extraTone !== -1) {
    if (version !== 0 && version < 131) {
      return 0;  // other groups only from 13.1
    }
    return 2;
  }
  return 1;
}


/**
 * Does the passed raw emoji string support skin tones?
 *
 * @param {string} raw
 * @param {number} version
 * @return {number} number of tones supported
 */
export function supportsTone(raw, version=0) {
  const check = (part) => {
    expando(part);  // don't splice, we don't return this

    const result = splitForModifiers(part);
    if (result === null) {
      return 0;
    }

    const {base, tone, extraTone} = result;
    return internalBaseToneSupport(base, version, tone, extraTone);
  };

  let count = 0;

  for (const part of iterate(raw)) {
    count = Math.max(check(part), count);
    if (count === 2) {
      break;
    }
  }

  return count;
}


/**
 * Returns the emoji which are different in the two strings. Used for gender comparisons and
 * only operates on same-length strings.
 *
 * @param {string} from source string
 * @param {string} to suggested replacement string
 * @return {string} only different emoji in replacement string
 */
export function delta(from, to) {
  const fi = split(from);
  const ti = split(to);

  if (fi.length !== ti.length) {
    // This should probably never happen, but just return the output string in this case.
    return to;
  }

  const eq = (a, b) => {
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    return true;
  };

  // TODO(samthor): It'd be nice if this only showed uniques.

  const out = [];
  while (fi.length && ti.length) {
    const fn = fi.shift();
    const tn = ti.shift();

    if (!eq(fn, tn)) {
      out.push(tn);
    }
  }

  return join(out);
}


/**
 * Normalizes the passed emoji, ensuring the right VS16 etc.
 *
 * @param {string} s
 * @return {string}
 */
export function normalize(s) {
  return join(split(s));
}


/**
 * Splits the passed emoji run into individual emoji parts.
 *
 * @param {string} s
 * @return {!Array<string>}
 */
export function splitToPart(s) {
  return split(s).map(single);
}


/**
 * Apply the given skin tone, or none for zero.
 *
 * @param {string} raw
 * @param {number=} version
 * @param {number=} applyTone
 * @param {number=} applyExtraTone
 * @return {string}
 */
export function applySkinTone(raw, version = 0, applyTone = 0, applyExtraTone = -1) {
  const apply = (part) => {
    part = part.slice();
    expando(part);

    const split = splitForModifiers(part);
    if (split === null) {
      return null;
    }
    const {base, tone, extraTone} = split;
    const count = internalBaseToneSupport(base, version, tone, extraTone);

    switch (count) {
      case 1:
        applyExtraTone = -1;
        break;
      case 2:
        break;
      default:
        return null;
    }

    const out = joinForModifiers({...split, tone: applyTone, extraTone: applyExtraTone});
    deexpando(out);
    return out;
  };

  return join(split(raw).map((part) => apply(part) || part));
}
