import {split, single, iterate, join} from '../src/encoding.js';
import {deexpando, expando} from '../src/expando.js';
import * as helper from '../src/helper.js';
import {
  unicode11,
  unicode12,
  unicode13,
  modifierBase as modifierBaseSource,
  roles as rolesSource,
} from '../src/raw/defs.js';
import {jsdecode} from '../src/string.js';
import {normalizePointAll, normalizePointGender} from '../src/normalize.js';

const roles = new Set();
jsdecode(rolesSource).forEach((role) => roles.add(role));

const modifierBase = new Set();
jsdecode(modifierBaseSource).forEach((b) => modifierBase.add(b));

// Remove both "kiss" and "couple with heart". The emoji test data (and vendor implementations) are
// ambiguous as to whether this is supported.
//  * These aren't expanded in "emoji-test.txt", but are listed in "emoji-data.txt"
//  * Only Microsoft supports the modifier, although macOS often eats the tone silently
modifierBase.delete(0x1f48f);
modifierBase.delete(0x1f491);

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
 * TODO: seed gender choice
 *
 * @param {string} raw
 * @param {number} version
 * @return {string}
 */
export function restoreForClient(raw, version) {
  if (version <= 0) {
    return raw;  // do nothing
  }

  if (version >= 130) {
    // we only need to denormalize ZWJ'ed emoji, fast-path
    if (raw.indexOf('\u{200d}') === -1) {
      return raw;
    }
    // TODO: regexp for musical notes / crown
  }

  const rewriter = (part) => {
    if (deexpando(part)) {
      return single(part);  // all expandos result in ancient valid emoji
    }
    const s = single(part);  // TODO: what we get from the server is "correct" modulo expandos

    if (part.length === 2 && part[0] === helper.runePerson) {
      switch (part[1]) {
        case helper.runeHolidayTree:
          if (version >= 130) {
            return s;
          }
          // "MX CLAUS" to f or m
          return String.fromCodePoint(choiceFromOptions(0x1f936, 0x1f385));

        case helper.runeMusicalNotes:
          // "DANCER" to f or m
          return String.fromCodePoint(choiceFromOptions(0x1f483, 0x1f57a));

        case helper.runeCrown:
          // "ROYALTY" to f or m
          return String.fromCodePoint(choiceFromOptions(0x1f478, 0x1f934));
      }

      // gendered hair supported only in 121 (hair from 110)
      if (version < 121 && helper.isHairEmoji(part[1])) {
        if (version < 110) {
          return '';  // no hair emoji supported
        }
        const p = choiceFromOptions(helper.runePersonWoman, helper.runePersonMan);
        return String.fromCodePoint(p, 0x200d, part[1]);
      }
    }

    if (version >= 130) {
      return s;
    } else if (unicode13Has(s)) {
      return '';
    }

    // TODO: we treat 12.1 as minimum 12.x support
    if (version >= 121) {
      return s;
    }

    // TODO: E12.1 added a ton of gendered folks, should only include from there

    // neutral "PEOPLE HOLDING HANDS" added in 12.1
    if (part.length === 3 && part[0] === helper.runePerson && part[1] === helper.runeHandshake && part[2] === helper.runePerson) {
      return String.fromCodePoint(choiceFromOptions(0x1f46d, 0x1f46b, 0x1f46c));
    }
    if (unicode12Has(s)) {
      return '';
    }

    if (version >= 110) {
      return s;
    } else if (unicode11Has(s)) {
      return '';
    }

    // give up < E11.0
    return s;
  };

  return split(raw).map(rewriter).join('');
}

/**
 * @param {string} raw
 * @param {number} version
 * @return {!Object<string, string>}
 */
export function genderVariants(raw, version) {

  // TODO: 
  //  * no neuter hair in E11
  //  * no "person with white cane", "person in motorized wheelchair", "person in manual wheelchair", until E12.1
  //  * no gendered tuxedo/bride until E13


  const build = (part) => {
    part = part.slice();
    expando(part);

    part = part.map(normalizePointGender).filter((x) => x !== 0);
    if (part.length === 0) {
      return [];
    }

    if (part.length === 1) {
      const only = part[0];
      if (roles.has(only)) {
        return {
          'n': [only],
          'f': [only, helper.runeGenderFemale],
          'm': [only, helper.runeGenderMale],
        };
      }

      // nothing else to do since we were expando'ed
      return null;
    }

    // All other variants should start with runePerson.
    if (part[0] !== helper.runePerson) {
      return null;
    }

    const peopleAt = [0];
    for (let i = 1; i < part.length; ++i) {
      if (part[i] === helper.runePerson) {
        peopleAt.push(i);
      }
    }

    if (peopleAt.length === 1) {
      // Person is at 0th position.

      const f = part.slice();
      f[0] = helper.runePersonWoman;
      const wasExpando = deexpando(f);

      const m = part.slice();
      m[0] = helper.runePersonMan;
      wasExpando && deexpando(m);  // don't try again if we didn't hit before

      return {
        'n': part, f, m,
      };
    }

    // TODO: paired gender emojis

    return null;
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

/**
 * Does the passed raw emoji string support skin tones?
 *
 * @param {string} raw
 * @param {number} version
 * @return {number} number of tones supported
 */
export function supportsTone(raw, version) {
  const check = (part) => {
    if (!helper.isGenderPerson(part[0])) {
      // We don't expando this, as modifierBase also contains the top-level old cases (including
      // double "holding hands" cases).
      return modifierBase.has(part[0]);
    }
    if (helper.isPersonGroup(part)) {
      // People are in the list of modifiers, but when used as a group, only "holding hands" supports
      // skin tone modification (it also supports double, see below).
      return (version === 0 || version >= 120) && part.includes(helper.runeHandshake);
    }
    // Not if this is a family.
    // TODO: future support
    return !helper.isFamilyPoints(part);
  };

  // TODO: E12.0 added support for "x holding hands" tones vs the emoji itself
  // TODO: E14.x+ might add handshake tones
  for (const part of iterate(raw)) {
    if (!check(part)) {
      continue;
    }
    if ((part[0] >= 0x1f46b && part[0] <= 0x1f46d) ||
        (helper.isPersonGroup(part) && part.includes(helper.runeHandshake))) {
      return 2;
    }
    return 1;
  }
  return 0;
}

/**
 * Helper to choose a random option.
 *
 * @param {!Array<number>} arr
 * @return {number}
 */
function choiceFromOptions(...arr) {
  const index = Math.floor(Math.random() * arr.length);
  return arr[index];
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
 * Apply the given skin tone, or none for zero.
 *
 * @param {string} raw
 * @param {number} tone
 * @return {string}
 */
export function applySkinTone(raw, tone) {
  if (tone && !helper.isToneModifier(tone)) {
    throw new Error('not a skinTone');
  }
  const out = [];

  for (const e of iterate(raw)) {
    // Family emoji seem like they could be toned (as they're a ZWJ of others that can also be),
    // but they're officially unsupported. Don't explicitly clean them either.
    if (helper.isFamilyPoints(e)) {
      out.push(e);
      continue;
    }

    const clean = e.filter((p) => !helper.isToneModifier(p));
    if (!tone) {
      out.push(clean);
      continue;
    }

    // TODO: this splices skinTone everywhere, we should do one of two things:
    // * if not 100% tones, set them all
    // * if 100% applied already, set the first that does not match (double cases)
    let personGroup = false;
    for (let i = 0; i < clean.length; ++i) {
      const check = clean[i];
      if (helper.isGenderPerson(check)) {
        personGroup = true;
      } else if (personGroup || !modifierBase.has(check)) {
        // If we're already a person group, don't modify anything but the people.
        // If we're not in the modifier list, don't modify us.
        continue;
      }
      clean.splice(i+1, 0, tone);
      ++i;
    }

    out.push(clean);
  }

  return join(out);
}
