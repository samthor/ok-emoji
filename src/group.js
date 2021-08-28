/**
 * @fileoverview Helpers for family groups.
 */

import * as helper from './helper.js';

/**
 * Checks whether this is a valid person group or family. Expects already expando'ed emoji.
 *
 * @param {number[]} points to check
 * @param {number} version to check at
 * @return {boolean}
 */
export function validPersonGroup(points, version = 0) {
  if (helper.isFamilyPoints(points)) {
    return true;
  }

  points = points.filter((x) => !helper.isToneModifier(x));
  if (points.length === 0) {
    return false;
  }
  // otherwise, check for person group

  const first = /** @type {number} */ (points.shift());
  const last = points.pop() ?? 0;

  if (!helper.isGenderPerson(first) || !helper.isGenderPerson(last)) {
    return false;
  }
  if (first === helper.runePerson && last !== helper.runePerson) {
    return false;  // person must go with person
  }
  if (first === helper.runePersonMan && last === helper.runePersonWoman) {
    return false;  // "WOMAN" always goes before "MAN" here
  }

  if (points.length === 1) {
    // check for "WITH HEART"
    if (points[0] === helper.runeHeart) {
      return true;
    }

    // check for "HOLDING HANDS"
    if (points[0] === helper.runeHandshake) {
      if (version !== 0 && version < 120 && first === helper.runePerson) {
        return false;  // neuter only at 120
      }
      return true;
    }

    return false;
  }

  if (points.length === 2) {
    // check for "KISS"
    if (points[0] === helper.runeHeart && points[1] === helper.runeKiss) {
      return true;
    }

    return false;
  }

  return false;
}