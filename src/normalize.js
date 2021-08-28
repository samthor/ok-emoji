/**
 * @fileoverview Simple helpers to reduce emoji to their gender-neutral base.
 *
 * Operates only on explicitly gendered simple emoji parts: people, children, and old people.
 */

import * as helper from './helper.js';

const singleBaseSource = [
  helper.runePerson, helper.runePersonWoman, helper.runePersonMan,
  helper.runeChild, helper.runeGirl, helper.runeBoy,  // child, girl, boy
  0x1f9d3, 0x1f475, 0x1f474,  // old {adult,woman,man}
];

export const singleBase = new Map();
while (singleBaseSource.length !== 0) {
  const source = singleBaseSource.splice(0, 3);
  singleBase.set(source[0], source);
  singleBase.set(source[1], source);
  singleBase.set(source[2], source);
}

/**
 * @param {number} point
 * @return {boolean} whether this is an unmodified single base
 */
export function isSingleBase(point) {
  return singleBase.has(point);
}

/**
 * @param {number} point
 * @return {number}
 */
export function normalizePointGender(point) {
  if (helper.isGender(point)) {
    return 0;
  }
  const base = singleBase.get(point);
  if (base !== undefined) {
    return base[0];
  }
  return point;
}

/**
 * @param {number} point
 * @return {number}
 */
 export function normalizePointAll(point) {
  if (helper.isToneModifier(point)) {
    return 0;
  }
  return normalizePointGender(point);
}
