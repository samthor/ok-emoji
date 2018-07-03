
import {jsdecode} from './string.js';

export const runeZWJ = 0x200d;
export const runeCap = 0x20e3;
export const runeVS16 = 0xfe0f;
export const runeTagCancel = 0xe007f;

/**
 * @param {number} p
 * @return {boolean} whether the passed rune is a diversity selector (one of five skin tones)
 */
export function isSkinTone(p) {
  return p >= 0x1f3fb && p <= 0x1f3ff;
}

/**
 * @param {number} p
 * @return {boolean} whether the passed rune is one of A-Z for flags
 */
export function isFlagPoint(p) {
  return p >= 0x1f1e6 && p <= 0x1f1ff;
}

/**
 * @param {number} p
 * @return {boolean} whether the passed rune is a tag character, for tag sequences
 */
export function isTag(p) {
	return p >= 0xe0020 && p < 0xe007f
}

/**
 * @type {!Array<number>}
 */
const skippable = [runeVS16, runeCap, runeTagCancel];

/**
 * Returns a count of the expected number of points displayed for the given valid emoji string.
 *
 * @param {string} s
 * @return {number} count
 */
export function emojiPointCount(s) {
  const points = jsdecode(s);

  let halfCount = 0;
  const l = points.length;
  for (let i = 0; i < l; ++i) {
    const p = points[i];
    if (p === runeZWJ) {
      halfCount -= 2;
    } else if (skippable.indexOf(p) !== -1 || isTag(p) || isSkinTone(p)) {
      // do nothing
    } else if (isFlagPoint(p)) {
      ++halfCount;
    } else {
      halfCount += 2;
    }
  }

  if (points.length === 0) {
    return 0;  // no points
  } else if (halfCount <= 2) {
    return 1;  // return minimum if string had content
  } else {
  	return (halfCount + 1) >> 1;  // round up
  }
}