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
 * @param {!Array<number>} out
 * @param {string} s
 * @param {number} i
 * @return {number}
 */
export function internalIterateStep(out, s, i) {
  const length = s.length;
  if (i === length) {
    return i;
  }

  let curr = s.codePointAt(i);
  if (curr === helper.runeZWJ) {
    return i + 1;  // zwj is single, invalid
  } else if (helper.isTagRune(curr)) {
    return i + 2;  // tag is double, invalid
  }

  out.push(curr);
  if (helper.isFlagPoint(curr)) {
    i += 2;  // flag is double

    const next = s.codePointAt(i);
    if (!helper.isFlagPoint(next)) {
      return i;
    }
    i += 2;  // flag is double, we always consume next now
    out.push(next);

    const check = String.fromCodePoint(curr, next);
    if (!flags.has(check)) {
      // we've found points "ABC"; "AB" isn't valid, we don't care if "BC" is, just yield three
      const supernext = s.codePointAt(i);
      if (helper.isFlagPoint(supernext)) {
        out.push(supernext);
        return i + 2;
      }
    }

    return i;  // normal valid 2-part flag
  }

  // otherwise, this starts an emoji
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
          return i;
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

  return i;
}

/**
 * @param {string} s to parse, containing zero to many emoji
 * @yield {!Array<number>} single emoji runs
 */
export function *iterate(s) {
  const length = s.length;
  const out = [];
  let i = 0;

  const is = internalIterateStep.bind(null, out, s);
  while (i < length) {
    i = is(i);
    if (out.length !== 0) {
      yield out.splice(0, out.length);
    }
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
 * Appends a single part to the passed array. Starts with a ZWJ if needed.
 *
 * @param {!Array<number>} out
 * @param {!Array<number>} points
 * @param {number} i where within points to operate
 * @return {number} new position within points
 */
export function internalSinglePart(out, points, i) {
  if (i === points.length) {
    return i;
  }
  const start = points[i];
  const isFlag = helper.isFlagPoint(start);

  // We should only ever see country flag points with themselves, but this just does something sane
  // if they're inserted into the middle of another run.
  const last = out.length !== 0 ? out[out.length - 1] : 0;
  if (last === 0 || isFlag || helper.isFlagPoint(last)) {
    // do nothing
  } else {
    out.push(helper.runeZWJ);
  }

  out.push(start);
  i += 1;  // consumed it
  if (isFlag) {
    return i;
  }

  const next = i === points.length ? 0 : points[i];
  if (next === 0) {
    // do nothing
  } else if (helper.isTagRune(next)) {
    // consume all tags until cancel or not a tag
    i += 1;  // we checked 'next'
    for (; i < points.length; ++i) {
      const check = points[i];
      if (!helper.isTagRune(check)) {
        break;
      } else if (check === runeTagCancel) {
        // shouldn't happen, handle anyway
        ++i;
        break;
      }
      out.push(check);
    }
    out.push(helper.runeTagCancel);
    return i;
  } else if (helper.isToneModifier(next)) {
    out.push(next);
    return i + 1;
  }

  if (variation.has(start)) {
    out.push(helper.runeVS16);  // insert VS16 if not tone modified (tone implies emoji already)
  }

  if (next === helper.runeKeycap) {
    out.push(next);
    return i + 1;
  }

  return i;
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

  const is = internalSinglePart.bind(null, out, points);
  for (let i = 0; i < points.length; i = is(i)) {}

  return String.fromCodePoint.apply(null, out);
}
