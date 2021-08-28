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

export const runePerson = 0x1f9d1;
export const runePersonWoman = 0x1f469;
export const runePersonMan = 0x1f468;

export const runeChild = 0x1f9d2;
export const runeGirl = 0x1f467;
export const runeBoy = 0x1f466;

export const runeGenderFemale = 0x2640;
export const runeGenderMale = 0x2642;
export const runeGenderFauxBoth = 0x2641;  // used as a key for F/M groups, "EARTH"

export const runeHandshake = 0x1f91d;
export const runeHeart = 0x2764;
export const runeKiss = 0x1f48b;
export const runeHolidayTree = 0x1f384;
export const runeNuclearFamily = 0x1f46a;
export const runeCrown = 0x1f451;
export const runeMusicalNotes = 0x1f3b6;

/**
 * @param {number} r
 * @return {boolean}
 */
export function isFlagPoint(r) {
  return r >= runeFlagA && r <= runeFlagZ;
}

/**
 * @param {number} r
 * @return {boolean}
 */
export function isFamilyMember(r) {
  return r >= 0x1f466 && r <= 0x1f469;
}

/**
 * @param {number} r
 * @return {boolean}
 */
export function isToneModifier(r) {
  return r >= 0x1f3fb && r <= 0x1f3ff;
}

/**
 * @param {number} r
 * @return {boolean}
 */
export function isHairEmoji(r) {
  return r >= 0x1f9b0 && r <= 0x1f9b3;
}

/**
 * @param {number} r
 * @return {boolean}
 */
export function isGenderPerson(r) {
	return r === runePersonWoman || r === runePersonMan || r === runePerson;
}

/**
 * @param {number} r
 * @return {boolean}
 */
export function isGender(r) {
	return r === runeGenderFemale || r === runeGenderMale;
}

/**
 * @param {number} r
 * @return {boolean}
 */
export function isTagRune(r) {
  return r >= runeTagSpace && r <= runeTagCancel;
}

/**
 * @param {number[]} p points to check
 * @return {boolean} whether this is probably a person group (not a Family)
 */
export function isPersonGroup(p) {
  if (p.length <= 2) {
    return false;
  }
  if (!(isGenderPerson(p[0]) && isGenderPerson(p[p.length - 1]))) {
    return false;
  }
  let count = 0;
  for (const point of p) {
    if (isGenderPerson(point)) {
      ++count;
    }
  }
  // for now, these always have two people at start/end
  return count === 2;
}

/**
 * @param {number[]} points points to check
 * @return {boolean} whether this is a Family
 */
export function isFamilyPoints(points) {
  if (points.length < 2) {
    return false;
  }
  const family = points.slice();

  const adults = [];
  while (isGenderPerson(family[0])) {
    adults.push(family.shift());
  }
  for (const child of family) {
    if (child !== runeBoy && child !== runeGirl) {
      return false;
    }
  }

  if (!(family.length === 1 || family.length === 2) && !(adults.length === 1 || adults.length === 2)) {
    return false;  // must have 1 or 2 of each
  }

  if (adults[0] === runePersonWoman) {
    if (adults.length === 2 && adults[1] === runePersonMan) {
      return false;  // "MAN" before "WOMAN" in family emoji
    }
  }

  if (family[0] === runeBoy) {
    if (family.length === 2 && family[1] === runeGirl) {
      return false;  // "GIRL" must become before "BOY" (inverse from above)
    }
  }

  return true;
}
