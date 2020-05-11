
import {
  modifierBase as modifierBaseSource,
  professions as professionsSource,
  roles as rolesSource,
} from './raw/defs.js';
import {extraGenderList} from './raw/gender.js';
import * as helper from './helper.js';
import {expando, deexpando} from './expando.js';
import {jsdecode} from './string.js';

const modifierBase = new Set();
jsdecode(modifierBaseSource).forEach((b) => modifierBase.add(b));

const roles = new Set();
jsdecode(rolesSource).forEach((role) => roles.add(role));

const extraBases = new Map();
for (let i = 0; i < extraGenderList.length; i += 3) {
  const neutral = extraGenderList[i+2];
  if (neutral !== 0) {
    extraBases.set(extraGenderList[i+0], neutral);
    extraBases.set(extraGenderList[i+1], neutral);
  }
}

/**
 * @param {!Array<number>} p points to check
 * @return {boolean} whether this is a Family
 */
function isFamilyPoints(p) {
  return p.length >= 2 && helper.isFamilyMember(p[0]) && helper.isFamilyMember(p[1]);
}

/**
 * @param {!Array<number>} p points to check
 * @return {boolean} whether this is a person group (not a Family)
 */
function isPersonGroup(p) {
  if (p.length <= 2) {
    return false;
  }
  let count = 0;
  for (const point of p) {
    if (helper.isGenderPerson(point)) {
      ++count;
    }
  }
  // for now, these always have two people
  return count === 2;
}

/**
 * Strips all gender, skin tone etc from the passed emoji and reduce it to its simplest common
 * ancestor.
 *
 * This won't apply to emoji without ancestors: e.g., Santa Claus and Mrs Claus.
 *
 * @param {!Array<number>} points
 * @return {!Array<number>} simplified common emoji (neuter etc)
 */
export function singleBase(points) {
  points = points.filter((point) => !helper.isToneModifier(point));

  if (isFamilyPoints(points)) {
    return [0x1f46a];  // generic nuclear family
  }

  const possibleExpando = expando(points) || helper.isGenderPerson(points[0]);

  points = points.map((point) => {
    if (helper.isGenderPerson(point)) {
      return helper.runePerson;
    } else if (helper.isGender(point)) {
      return 0;
    }

    const other = extraBases.get(point);
    if (other !== undefined) {
      return other;
    }

    return point;
  }).filter((point) => point !== 0);

  possibleExpando && deexpando(points);
  return points;
}