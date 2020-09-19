/**
 * @fileoverview Simple helpers to reduce emoji to their gender-neutral base.
 *
 * Operates only on explicitly gendered simple emoji parts: people, children, and old people.
 */

import * as helper from './helper.js';

const singleBaseSource = [
  helper.runePerson, helper.runePersonWoman, helper.runePersonMan,
  0x1f9d2, 0x1f467, 0x1f466,  // child, girl, boy
  0x1f9d3, 0x1f475, 0x1f474,  // old {adult,woman,man}
];

export const singleBase = new Map();
while (singleBaseSource.length !== 0) {
  const source = singleBaseSource.splice(0, 3);
  singleBase.set(source[0], source);
  singleBase.set(source[1], source);
  singleBase.set(source[2], source);
}

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

export function normalizePointAll(point) {
  if (helper.isToneModifier(point)) {
    return 0;
  }
  return normalizePointGender(point);
}
