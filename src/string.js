/**
 * @fileoverview Low-level string functions that have no knowledge of emoji.
 */

/**
 * Decodes a JavaScript string into Unicode code points.
 *
 * This is _probably_ the same as `Array.from` in some places.
 *
 * @param {string} s to decode
 * @return {number[]} code points
 */
export function jsdecode(s) {
  let i = 0;
  const len = s.length;

  /** @type {number[]} */
  const points = [];

  while (i < len) {
    const r = s.codePointAt(i) ?? 0;
    if (r > 0xffff) {
      i += 2;  // surrogate pair
    } else {
      ++i;
    }
    points.push(r);
  }

  return points;
}
