/**
 * @fileoverview Low-level string functions that have no knowledge of emoji.
 */

/**
 * Decodes a JavaScript string into Unicode code points.
 *
 * @param {string} s to decode
 * @return {!Array<number>} code points
 */
export function jsdecode(s) {
  let i = 0;
  const len = s.length;
  const points = [];

  while (i < len) {
    const r = s.codePointAt(i);
    if (r > 0xffff) {
      i += 2;  // surrogate pair
    } else {
      ++i;
    }
    points.push(r);
  }

  return points;
}
