/**
 * @fileoverview Helpers to convert emoji string to raw points and back.
 */

import {variation as source} from './raw/defs.js';
import flags from './flags.js';
import {jsdecode} from './string.js';
import * as helper from './helper.js';

// Some notes on country flags. These are inconsistent between platforms and browsers, especially
// when combined with other characters (i.e., with ZWJ), although this might be invalid per spec.
//
//   * Firefox and Safari (presumably iOS too) will search for valid flags: "ABC" will show a flag
//     for "BC" if "AB" is invalid.
//   * Chrome on macOS will show all letters of "ABC" individually
//   * ChromeOS (and possibly Linux) will show "AB" as an "unknown flag" emoji and "C" as a letter
//   * If [non-flag, ZWJ, A, B, C] appears, Firefox will join with just "A"; Chrome with "AB", and
//     Safari with nothing.
//
// We take the following approach (which can lose data):
//
//   * Country flags cannot be part of ZWJ sequences
//   * Sequences of three characters "ABC" where "BC" are valid are returned as three
//   * Any flag "AB" is returned as a pair (including invalid ones), but correct wins over three

/**
 * @type {!Set<number>} emoji base which require VS16
 */
const variation = new Set(jsdecode(source));

/**
 * @param {string} raw to split
 * @return {!Array<!Array<number>>} split emoji string
 */
export function split(raw) {
  return Array.from(iterate(raw));
}

/**
 * @param {string} s to parse, containing zero to many emoji
 * @yield {!Array<number>} single emoji runs
 */
export function *iterate(s) {
  let i = 0;
  let curr = 0;
  const length = s.length;

  while (i < length) {
    curr = s.codePointAt(i);
    if (curr === helper.runeZWJ) {
      i += 1;  // zwj is single, invalid
      continue;
    } else if (helper.isTagRune(curr)) {
      i += 2;  // tag is double, invalid
      continue;
    }

    if (helper.isFlagPoint(curr)) {
      i += 2;  // flag is double
      const next = s.codePointAt(i);

      if (!helper.isFlagPoint(next)) {
        yield [curr];
        continue;
      }
      i += 2;  // flag is double

      const check = String.fromCodePoint(curr, next);
      if (!flags.has(check)) {
        // we've found points "ABC"; "AB" isn't valid, we don't care if "BC" is, just yield three
        const supernext = s.codePointAt(i);
        if (helper.isFlagPoint(supernext)) {
          i += 2;
          yield [curr, next, supernext];
          continue;
        }
      }

      yield [curr, next];  // normal valid 2-part flag
      continue;
    }

    // otherwise, this starts an emoji
    const out = [curr];
  yieldLoop:
    for (;;) {
      // move past current emoji (surrogate or not)
      if (curr > 0xffff) {
        i += 2;
      } else {
        i += 1;
      }

      curr = s.codePointAt(i);
      if (curr === helper.runeVS16) {
        i += 1;  // step over VS16
        curr = s.codePointAt(i);
      }

      if (helper.isTagRune(curr)) {
        // tagged emoji, consume until runeTagCancel or invalid non-tag
        out.push(curr);
        for (;;) {
          i += 2;
          if (i === length) {
            break yieldLoop;
          }
          curr = s.codePointAt(i);
          if (!helper.isTagRune(curr)) {
            break;
          } else if (curr === helper.runeTagCancel) {
            i += 2;
            break;
          }
          out.push(curr);
        }
      } else if (curr === helper.runeKeycap) {
        out.push(curr);  // always consume
        i += 1;          // keycap is single
      } else if (helper.isToneModifier(curr)) {
        out.push(curr);  // always consume
        i += 2;          // tone always surrogate
      }

      if (s.codePointAt(i) !== helper.runeZWJ) {
        break;  // yield emoji, done (also catches undefined)
      }
      i += 1;  // ZWJ is single
      if (i === length) {
        break;  // trailing ZWJ
      }

      curr = s.codePointAt(i);
      if (helper.isTagRune(curr) || helper.isFlagPoint(curr)) {
        break;  // invalid ZWJ sequence, don't include
      }
      out.push(curr);
    }

    yield out;
  }
}

/**
 * Joins a series of known emoji for display.
 *
 * @param {!Array<!Array<number>>} arr
 * @return {string}
 */
export function join(arr) {
  return arr.map(single).join('');
}

/**
 * Joins a series of emoji points for display as one character (i.e., includes ZWJs to join).
 *
 * Adds VS16 as needed for emoji requiring the selector.
 *
 * @param {!Array<number>} points
 * @return {string}
 */
export function single(points) {
  const out = [];
  let wasFlag = false;

  for (let i = 0; i < points.length; ++i) {
    const start = points[i];
    out.push(start);

    if (helper.isFlagPoint(start)) {
      wasFlag = true;
      continue;  // flags, ignore
    } else if (!wasFlag && i) {
      // wasn't a flag and we're past 1st point: add ZWJ
      out.splice(out.length - 1, 0, helper.runeZWJ);
    }
    wasFlag = false;

    const next = points[i + 1] || 0;

    if (helper.isTagRune(next)) {
      // consume all tags until cancel or not a tag
      let j = i + 1;
      while (j < points.length) {
        // nb. checks ourselves again, in case the start is runeTagCancel
        if (!helper.isTagRune(points[j]) || points[j] === helper.runeTagCancel) {
          break;
        }
        out.push(points[j]);
        ++j;
      }
      out.push(helper.runeTagCancel);
      i = j;
      continue;
    }

    if (helper.isToneModifier(next)) {
      out.push(next);
      ++i;
      continue;
    }

    if (variation.has(start)) {
      out.push(helper.runeVS16);  // insert VS16 if not tone modified (tone implies emoji already)
    }

    if (next === helper.runeKeycap) {
      out.push(next);
      ++i;
      continue;
    }
  }

  return String.fromCodePoint.apply(null, out);
}
