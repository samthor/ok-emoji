
import {
  modifierBase as modifierBaseSource,
  professions as professionsSource,
  roles as rolesSource,
} from './raw/defs.js';
import * as helper from './helper.js';
import {expando, deexpando} from './expando.js';
import {jsdecode} from './string.js';

const modifierBase = new Set();
jsdecode(modifierBaseSource).forEach((b) => modifierBase.add(b));

// Remove both "kiss" and "couple with heart". The emoji test data (and vendor implementations) are
// ambiguous as to whether this is supported.
//  * These aren't expanded in "emoji-test.txt", but are listed in "emoji-data.txt"
//  * Only Microsoft supports the modifier, although macOS often eats the tone silently
modifierBase.delete(0x1f48f);
modifierBase.delete(0x1f491);

const roles = new Set();
jsdecode(rolesSource).forEach((role) => roles.add(role));

function buildSourceMap(raw) {
  const m = new Map();
  for (let i = 0; i < raw.length; i += 3) {
    const data = raw.slice(i, i + 3);
    if (raw[i+0] !== 0) {
      m.set(raw[i+0], data);
    }
    m.set(raw[i+1], data);
    m.set(raw[i+2], data);
  }
  return m;
}

/**
 * @type {!Object<string, !Array<number>>} of family combinations
 */
const familyExpansion = (() => {
  // Unlike other joined emoji, males go first in Family groups, but girls still come before boys.
  const parents = ['mf', 'mm', 'ff', 'm', 'f']
  const children = ['b', 'g', 'gb', 'bb', 'gg'];

  const expand = {
    'f': helper.runePersonWoman,
    'm': helper.runePersonMan,
    'b': 0x1f466,
    'g': 0x1f467,
  };

  const all = {
    'n': Object.freeze([helper.runeNuclearFamily]),
  };

  parents.forEach((parent) => {
    children.forEach((child) => {
      const text = parent + child;
      all[text] = Object.freeze(Array.from(text).map((c) => expand[c]));
    });
  });

  return Object.freeze(all);
})();

// Describes bases which should be returned in singleBase().
const extraBasesSource = [
  0x1f9d2, 0x1f467, 0x1f466,  // child, girl, boy
  0x1f9d3, 0x1f475, 0x1f474,  // old {adult,woman,man}
];
const extraBases = buildSourceMap(extraBasesSource);

// Describes gender variants which have no clear neutral case, but which can be used as variants.
// Includes the bases from above for convenience.
const genderVariantSource = extraBasesSource.concat([
  0, 0x1f483, 0x1f57a,  // dancers
  0, 0x1f478, 0x1f934,  // princess, prince
  0, 0x1f930, 0,        // pregnant woman
  0, 0x1f9d5, 0,        // woman with headscarf
  0, 0, 0x1f9d4,        // man: beard
]);
const genderVariant = buildSourceMap(genderVariantSource);

/**
 * Returns the base emoji for the given single emoji. This assumes input is already expando'ed.
 *
 * @param {!Array<number>} points already expando'ed points
 * @return {!Array<number>}
 */
function internalSingleBase(points) {
  if (helper.isFamilyPoints(points)) {
    return [helper.runeNuclearFamily];  // generic nuclear family
  }
  const out = points.map((point) => {
    if (helper.isGenderPerson(point)) {
      return helper.runePerson;
    } else if (helper.isGender(point) || helper.isToneModifier(point)) {
      return 0;
    } else if (extraBases.has(point)) {
      return extraBases.get(point)[0];  // neutral is first
    } else {
      return point;
    }
  }).filter((point) => point !== 0);

  if (!out.length && points.length) {
    const first = points[0];
    if (helper.isGender(first) || helper.isToneModifier(first)) {
      return [first];
    }
  }
  return out;
}

/**
 * Strips all gender, skin tone etc from the passed single emoji and reduce it to its simplest
 * common ancestor.
 *
 * @param {!Array<number>} points
 * @return {!Array<number>} simplified common emoji (neuter etc)
 */
export function singleBase(points) {
  points = points.slice();  // as we call expando which changes this
  const possibleExpando = expando(points) || helper.isGenderPerson(points[0]);

  points = internalSingleBase(points);

  possibleExpando && deexpando(points);
  return points;
}

/**
 * Returns gender variants for the passed emoji. Handles already expando'ed and based points.
 *
 * @param {!Array<number>} base
 * @return {?Object<string, !Array<number>>} possible variants
 */
function internalGenderVariants(base) {
  if (base.length === 1) {
    const only = base[0];

    if (only === helper.runeNuclearFamily) {
      return familyExpansion;
    }

    // TODO(samthor): We could pretty easily turn single profession indicators (e.g., "fire truck")
    // into personified applications of those professions. It's not clear this is intuitive though.

    // This is a role, e.g., Construction Worker, that can stand alone (neuter) or have a female or
    // male modifier included.
    if (roles.has(only)) {
      return {
        'n': [only],
        'f': [only, helper.runeGenderFemale],
        'm': [only, helper.runeGenderMale],
      };
    }

    // This is an emoji which has gender variants (including bases). The 'only' emoji here might
    // already be gendered; we don't care, just get the shared result and return all cases.
    if (genderVariant.has(only)) {
      const [n, f, m] = genderVariant.get(only);
      const out = {};
      if (n !== 0) {
        out['n'] = [n];
      }
      if (f !== 0) {
        out['f'] = [f];
      }
      if (m !== 0) {
        out['m'] = [m];
      }
      return out;
    }

    // fall-through to person case (since there might be just one)
  }

  // All other variants should start with runePerson.
  if (base[0] !== helper.runePerson) {
    return null;
  }

  const peopleAt = [0];
  for (let i = 1; i < base.length; ++i) {
    if (base[i] === helper.runePerson) {
      peopleAt.push(i);
    }
  }

  if (peopleAt.length === 1) {
    const f = base.slice();
    f[0] = helper.runePersonWoman;
    const m = base.slice();
    m[0] = helper.runePersonMan;
    return {
      'n': base, f, m,
    };
  } else if (peopleAt.length === 2) {
    const [a, b] = peopleAt;
    const swapPair = (first, second) => {
      const out = base.slice();
      out[a] = first;
      out[b] = second;
      return out;
    };
    return {
      'n': base,
      'f': swapPair(helper.runePersonWoman, helper.runePersonWoman),
      'm': swapPair(helper.runePersonMan, helper.runePersonMan),
      'fm': swapPair(helper.runePersonWoman, helper.runePersonMan),
    };
  }

  return null;
}

/**
 * Finds gender variants for the passed single emoji, or null if there are none.
 *
 * The returned object contains keys related to the type of variant generated. Different emoji may
 * cause different keys to appear.
 *
 * @param {!Array<number>} base
 * @return {?Object<string, !Array<number>>} possible variants
 */
export function genderVariants(points) {
  points = points.slice();  // as we call expando which changes this
  const possibleExpando = expando(points) || helper.isGenderPerson(points[0]);
  const base = internalSingleBase(points);

  const options = internalGenderVariants(base);
  if (options === null) {
    return null;
  }

  if (possibleExpando) {
    Object.values(options).forEach(deexpando);
  }

  return options;
}

/**
 * Does the passed single emoji support skin tones?
 *
 * @param {!Array<number>} points
 * @return {boolean}
 */
export function supportsTone(points) {
  if (!helper.isGenderPerson(points[0])) {
    // We don't expando this, as modifierBase also contains the top-level weird cases (including
    // double "holding hands" cases).
    return modifierBase.has(points[0]);
  } else if (helper.isPersonGroup(points)) {
    // People are in the list of modifiers, but when used as a group, only "holding hands" supports
    // skin tone modification (it also supports double, see below).
    return points.includes(helper.runeHandshake);
  }
  return !helper.isFamilyPoints(points);
}

/**
 * Does the passed single emoji support double application of skin tone?
 *
 * @param {!Array<number>} points
 * @return {boolean}
 */
export function supportsDoubleTone(points) {
  // look for non-expandoed holding hands cases plus real one
  // this is "WOMEN HOLDING HANDS", "MEN HOLDING HANDS", and "WOMAN AND MAN HOLDING HANDS"
  return (points[0] >= 0x1f46b && points[0] <= 0x1f46d) ||
      (helper.isPersonGroup(points) && points.includes(helper.runeHandshake));
}
