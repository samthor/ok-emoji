/**
 * @fileoverview Exports emoji constants and some helpers.
 */

export const runeVS16 = 0xfe0f;
export const runeZWJ = 0x200d;
export const runeTagSpace = 0xe0020;
export const runeTagCancel = 0xe007f;
export const runeKeycap = 0x20e3;
export const runeFlagA = 0x1f1e6;
export const runeFlagZ = 0x1f1ff;

export const runePersonWoman = 0x1f469;
export const runePersonMan = 0x1f468;
export const runePerson = 0x1f9d1;

export const runeGenderFemale = 0x2640;
export const runeGenderMale = 0x2642;

export const runeHandshake = 0x1f91d;
export const runeHeart = 0x2764;
export const runeKiss = 0x1f48b;
export const runeHolidayTree = 0x1f384;
export const runeNuclearFamily = 0x1f46a;

export function isFlagPoint(r) {
  return r >= runeFlagA && r <= runeFlagZ;
}

export function isFamilyMember(r) {
  return r >= 0x1f466 && r <= 0x1f469;
}

export function isToneModifier(r) {
  return r >= 0x1f3fb && r <= 0x1f3ff;
}

export function isHairEmoji(r) {
  return r >= 0x1f9b0 && r <= 0x1f9b3;
}

export function isGenderPerson(r) {
	return r === runePersonWoman || r === runePersonMan || r === runePerson;
}

export function isGender(r) {
	return r === runeGenderFemale || r === runeGenderMale;
}

export function isTagRune(r) {
  return r >= runeTagSpace && r <= runeTagCancel;
}
