
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
 * @param {number} p
 * @return {boolean} whether the passed rune can appear before a keycap
 */
export function isBeforeCap(p) {
  return p === 35 || p === 42 || (p >= 48 && p <= 57)  // #, * or 0-9
}

/**
 * @type {!Array<number>}
 */
const skippable = [runeVS16, runeCap, runeTagCancel];

/**
 * Returns a count of the expected number of points displayed for the given valid emoji string.
 *
 * Assumes the emoji is normalized/well-formed: if not, the result will likely just be lower than
 * rendered, and it'll be considered invalid anyway.
 *
 * @param {string} s
 * @return {number} count
 */
export function emojiPointCount(s) {
  const points = jsdecode(s);
  return _emojiPointCount(points);
}

/**
 * @param {!Array<number>} points
 * @return {number} count
 */
export function _emojiPointCount(points) {
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

/**
 * @param {string} s
 * @yield {?Array<number>}
 */
export function *iterateEmoji(s) {
  const points = jsdecode(s);
  yield *_iterateEmoji(points);
}

/**
 * @param {!Array<number>} points
 * @yield {?Array<number>}
 */
export function *_iterateEmoji(points) {
  let curr = {flag: false, v: []};
  const pending = [curr];

  const ensure = (flag) => {
    if (curr.flag !== flag) {
      curr = {flag: Boolean(flag), v: []};
      pending.push(curr);
    }
  };

  const l = points.length;
  for (let i = 0; i < l; ++i) {
    const p = points[i];

    if (isFlagPoint(p)) {
      ensure(true);  // force flag mode
      curr.v.push(p);
    } else if (skippable.indexOf(p) !== -1 || isTag(p) || isSkinTone(p) || p === runeZWJ) {
      ensure(false);  // force regular mode
      curr.v.push(p);
    } else {
      // ensure new char unless we follow a ZWJ
      const off = curr.v.length - 1;
      if (off !== -1 && curr.v[off] !== runeZWJ) {
        curr = {flag: false, v: [p]};
        pending.push(curr);
      } else {
        curr.v.push(p);
      }
    }

    while (pending.length > 1) {
      const cand = pending.shift();
      if (cand.v.length) {
        yield cand.v;
      }
    }
  }

  const tail = pending[0];
  if (tail.v.length) {
    yield tail.v;
  }
}