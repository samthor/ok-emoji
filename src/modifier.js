/**
 * @fileoverview Enhances the raw definitions with version information.
 */

// NOTES:
//   E12.1 only added neuter fix for professions, plus broken "people holding hands" stuff
//   E13.1 added some ZWJs, beard gender, and skin tones for people groups

import {
  professions as professionsSource,
  modifierBase as modifierBaseSource,
  roles as rolesSource,
} from './raw/defs.js';
import {jsdecode} from './string.js';
import * as helper from './helper.js';
import {singleBase} from './normalize.js';

const professionsSet = new Set(Array.from(jsdecode(professionsSource)));

// nb. Not in Go code that generates defs. Only from 14.0+.
professionsSet.add(helper.runeCrown);
professionsSet.add(helper.runeMusicalNotes);

const rolesSet = new Set(Array.from(jsdecode(rolesSource)));
const modifierBaseSet = new Set(Array.from(jsdecode(modifierBaseSource)));

/**
 * This is override source data for professions and roles across versions. This maps runes to their
 * config.
 *
 * Each config can have three properties:
 *   - f: emoji introduced from
 *   - g: gender introduced from
 *   - n: neuter introduced from
 *
 * If `f` is not specified, this is assumed to be before E11. If `g` or `n` are not specified, they
 * take the value of `f`.
 */
const configSource = [
  {g: 120}, [0x1f9cd, 0x1f9ce, 0x1f9cf, 0x1f9af, 0x1f9bc, 0x1f9bd],  // a11y emoji
  {g: 130}, [0x1f470, 0x1f935],  // wedding emoji
  {f: 110}, [0x1f9b8, 0x1f9b9],  // superhero/villan
  {f: 110, n: 121}, [0x1f9b0, 0x1f9b1, 0x1f9b2, 0x1f9b3],  // hair
  {f: 130}, [0x1f37c],  // feeding baby
  {g: 131}, [0x1f9d4],  // beard
  {n: 140}, [helper.runeCrown, helper.runeMusicalNotes],  // future emoji
  {n: 130}, [helper.runeHolidayTree],  // claus
  {n: 121}, [helper.runeHandshake],
  {}, [helper.runeKiss, helper.runeHeart],
];

function updateConfig(config) {
  const version = config['f'] = config['f'] || 0;  // default to zero
  config['g'] = config['g'] || version;
  config['n'] = config['n'] || version;
  return config;
}

const defaultRoleConfig = updateConfig({});
const defaultProfessionConfig = updateConfig({n: 121});

const unicodeConfig = new Map();
for (let i = 0; i < configSource.length; i += 2) {
  const config = updateConfig(configSource[i+0]);
  const each = configSource[i+1];
  each.forEach((point) => unicodeConfig.set(point, config));
}


/**
 * @param {number} base
 * @return {?{f: number, g: number, n: version}}
 */
export function getPersonConfig(base) {
  const config = unicodeConfig.get(base);
  if (config !== undefined) {
    return config;
  }
  if (professionsSet.has(base)) {
    return defaultProfessionConfig;
  }
  if (rolesSet.has(base) || singleBase.has(base)) {
    return defaultRoleConfig;
  }
  return null;
}


/**
 * @param {number} base
 * @return {boolean}
 */
export function isProfession(base) {
  return professionsSet.has(base);
}


/**
 * @param {number} base
 * @return {boolean}
 */
export function isRole(base) {
  return rolesSet.has(base)
}


/**
 * @param {number} base
 * @return {boolean}
 */
export function isModifierBase(base) {
  return modifierBaseSet.has(base);
}


/**
 * @param {number} base
 * @return {boolean}
 */
export function isGroup(base) {
  return base === helper.runeKiss || base === helper.runeHandshake || base === helper.runeHeart;
}


/**
 * Returns information on a modifiable emoji. Expects to be pre-expando'ed.
 *
 * @param {!Array<number>} part
 * @return {?{base: number, gender: number, tone: number, extraTone: number}}
 */
export function splitForModifiers(part) {
  if (part.length === 0) {
    return null;
  }
  part = part.slice();

  const group = internalMatchGroup(part);
  if (group !== null) {
    return group;
  }

  const out = {
    base: part[0],
    gender: -1,
    tone: -1,
    extraTone: -1,
  };

  if (modifierBaseSet.has(part[0])) {
    out.tone = 0;  // has possible tone

    if (helper.isToneModifier(part[1])) {
      out.tone = part.splice(1, 1)[0];  // has specific tone, steal
    }
  }

  if (rolesSet.has(part[0])) {
    out.gender = helper.isGender(part[1]) ? part.splice(1, 1)[0] : 0;
    if (part.length !== 1) {
      return null;  // role had unknown suffix
    }

    return out;
  }

  const b = singleBase.get(part[0]);
  if (b === undefined) {
    return null;  // this matches "PERSON", which eventually gives us most matches
  }
  out.base = b[0];
  out.gender = 0;

  switch (part[0]) {
    case b[1]:
      out.gender = helper.runeGenderFemale;
      break;

    case b[2]:
      out.gender = helper.runeGenderMale;
      break;
  }

  if (part.length === 1) {
    return out;
  } else if (part.length !== 2 || !helper.isGenderPerson(part[0])) {
    return null;  // non-person with ZWJ, ignore
  }

  out.base = part[1];
  if (!professionsSet.has(out.base)) {
    return null;
  }
  return out;
}


const personForGender = (gender, isLeft) => {
  switch (gender) {
    case helper.runeGenderMale:
      return helper.runePersonMan;

    case helper.runeGenderFemale:
      return helper.runePersonWoman;

    case helper.runeGenderFauxBoth:
      return isLeft ? helper.runePersonWoman : helper.runePersonMan;
  }

  return helper.runePerson;
};


/**
 * Joins a modifiable emoji. Doesn't deexpando.
 *
 * @param {!Array<number>} part
 * @param {?{base: number, gender: number, tone: number, extraTone: number}}
 */
export function joinForModifiers({base, gender, tone, extraTone}) {
  const out = [base];

  if (isGroup(base)) {
    if (base === helper.runeKiss) {
      out.unshift(helper.runeHeart);  // kiss group has heart before it
    }
    if (!helper.isToneModifier(tone) || !helper.isToneModifier(extraTone)) {
      extraTone = tone;
    }
    out.unshift(personForGender(gender, true), tone);
    out.push(personForGender(gender, false), extraTone);
    return out.filter((x) => x !== 0);
  }

  // otherwise, treat as normal

  helper.isToneModifier(tone) && out.push(tone);

  if (professionsSet.has(base)) {
    let genderPoint = helper.runePerson;

    switch (gender) {
      case helper.runeGenderFemale:
        genderPoint = helper.runePersonWoman;
        break;
      case helper.runeGenderMale:
        genderPoint = helper.runePersonMan;
        break;
    }

    out.push(genderPoint);  // base ends up after genderPoint
    out.reverse();  // put tone first
  } else if (helper.isGender(gender) && rolesSet.has(base)) {
    out.push(gender);
  } else {
    const b = singleBase.get(base);
    if (b !== undefined) {
      let index = 0;
      if (gender === helper.runeGenderFemale) {
        index = 1;
      } else if (gender === helper.runeGenderMale) {
        index = 2;
      }
      out[0] = b[index];
    }
  }

  return out;
}


/**
 * @param {!Array<number>} part
 * @return {?{base: number, gender: number, tone: number, extraTone: number}}
 */
function internalMatchGroup(points) {
  if (points.length < 3) {
    return null;
  }
  points = points.slice();

  const left = consumePersonTone(points);
  if (left === null) {
    return null;
  }

  let i;
  for (i = 1; i < points.length; ++i) {
    if (helper.isGenderPerson(points[i])) {
      break;
    }
  }
  if (i === points.length) {
    return null;
  }

  const rest = points.splice(i, points.length - i);
  const right = consumePersonTone(rest);
  if (right === null || rest.length !== 0) {
    return null;
  }

  // left/right + points is mid

  let gender = 0;  // neutral implicit
  let base = points.pop();

  if (left.person === helper.runePerson) {
    if (right.person !== helper.runePerson) {
      return null;  // person must go with person
    }
  } else if (left.person === helper.runePersonMan) {
    if (right.person === helper.runePersonWoman) {
      return null;  // "WOMAN" always goes before "MAN" here
    }
    gender = helper.runeGenderMale;
  } else if (right.person === helper.runePersonWoman) {
    gender = helper.runeGenderFemale;
  } else {
    gender = helper.runeGenderFauxBoth;
  }

  switch (points.length) {
    case 0:
      if (!(base === helper.runeHeart || base === helper.runeHandshake)) {
        return null;
      }
      break;

    case 1:
      if (!(base === helper.runeKiss && points[0] === helper.runeHeart)) {
        return null;
      }
      break;

    default:
      return null;
  }

  const tone = left.tone;
  let extraTone = right.tone;

  if (!helper.isToneModifier(tone) || !helper.isToneModifier(extraTone)) {
    extraTone = tone;
  }

  return {
    base,
    gender,
    tone: left.tone,
    extraTone: right.tone,
  };
}


function consumePersonTone(points) {
  if (!helper.isGenderPerson(points[0])) {
    return null;
  }
  const out = {
    person: points.shift(),
    tone: 0,
  };
  if (helper.isToneModifier(points[0])) {
    out.tone = points.shift();
  }
  return out;
}
