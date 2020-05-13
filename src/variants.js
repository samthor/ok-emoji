
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

const roles = new Set();
jsdecode(rolesSource).forEach((role) => roles.add(role));

const extraBasesSource = [
  0x1f9d2, 0x1f467, 0x1f466,  // child, girl, boy
  0x1f9d3, 0x1f475, 0x1f474,  // old {adult,woman,man}
];
const extraBases = new Map();
for (let i = 0; i < extraBasesSource.length; i += 3) {
  const neutral = extraBasesSource[i];
  extraBases.set(extraBasesSource[i+1], neutral);
  extraBases.set(extraBasesSource[i+2], neutral);
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
 * Returns the base emoji for the given single emoji. This assumes input is already expando'ed.
 *
 * @param {!Array<number>} points already expando'ed points
 * @return {!Array<number>}
 */
function internalSingleBase(points) {
  if (isFamilyPoints(points)) {
    return [helper.runeNuclearFamily];  // generic nuclear family
  }
  return points = points.map((point) => {
    if (helper.isGenderPerson(point)) {
      return helper.runePerson;
    } else if (helper.isGender(point) || helper.isToneModifier(point)) {
      return 0;
    } else if (extraBases.has(point)) {
      return extraBases.get(point);
    } else {
      return point;
    }
  }).filter((point) => point !== 0);
}

/**
 * Strips all gender, skin tone etc from the passed single emoji and reduce it to its simplest
 * common ancestor.
 *
 * @param {!Array<number>} points
 * @return {!Array<number>} simplified common emoji (neuter etc)
 */
export function singleBase(points) {
  const possibleExpando = expando(points) || helper.isGenderPerson(points[0]);

  points = internalSingleBase(points);

  possibleExpando && deexpando(points);
  return points;
}

/**
 * Does the passed emoji support skin tones?
 *
 * @param {!Array<number>} points
 * @return {boolean}
 */
export function supportsTone(points) {
  if (!helper.isGenderPerson(points[0])) {
    return modifierBase.has(points[0]);
  } else if (isPersonGroup(points)) {
    // People are in the list of modifiers, but when used as a group, only "holding hands" supports
    // skin tone modification.
    // TODO(samthor): This actually supports _double_ modification.
    return points.includes(helper.runeHandshake);
  }
  return !isFamilyPoints(points);
}
