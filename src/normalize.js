import * as helper from './helper.js';

const singleBaseSource = [
  helper.runePerson, helper.runePersonWoman, helper.runePersonMan,
  0x1f9d2, 0x1f467, 0x1f466,  // child, girl, boy
  0x1f9d3, 0x1f475, 0x1f474,  // old {adult,woman,man}
];

export const singleBase = new Map();
for (let i = 0; i < singleBaseSource.length; i += 3) {
  const base = singleBaseSource[i+0];
  singleBase.set(singleBaseSource[i+1], base);
  singleBase.set(singleBaseSource[i+2], base);
}

export function normalizePointGender(point) {
  if (helper.isGender(point)) {
    return 0;
  }
  const base = singleBase.get(point);
  if (base !== undefined) {
    return base;
  }
  return point;
}

export function normalizePointAll(point) {
  if (helper.isToneModifier(point)) {
    return 0;
  }
  return normalizePointGender(point);
}
