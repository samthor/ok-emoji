/**
 * @fileoverview Helpers to convert emoji string to raw points and back.
 */

import {variation as source} from './raw/defs.js';
import flags from './flags.js';
import {jsdecode} from './string.js';
import * as helper from './helper.js';

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
 * @param {string} s to parse, containing many characters
 * @yield {!Array<number>} single emoji runs
 */
export function *iterate(s) {
  const points = jsdecode(s).filter((x) => x !== helper.runeVS16);

  const length = points.length;
  for (let i = 0; i < length; ++i) {
    const start = points[i];
    if (start === helper.runeZWJ || helper.isTagRune(start)) {
      continue;  // just invalid, skip
    }

    if (helper.isFlagPoint(start)) {
      const next = points[i + 1];
      if (helper.isFlagPoint(next)) {
        const check = String.fromCodePoint(start, next);
        if (flags.has(check)) {
          ++i;
          yield [start, next];
          continue;
        }
      }
      // if single flag or not valid, yield one at a time
      yield [start];
      continue;
    }

    // otherwise, this starts an emoji
    const out = [start];
    for (;;) {
      const next = points[i + 1];
      if (helper.isTagRune(next)) {
        // tagged emoji, consume until runeTagCancel or invalid non-tag
        const from = ++i;
        for (; i < length; ++i) {
          const cand = points[i + 1] || 0;
          if (!helper.isTagRune(cand)) {
            break;
          } else if (cand === helper.runeTagCancel) {
            ++i;
            break;
          }
        }
        out.push(...points.slice(from, i));
      } else if (next === helper.runeKeycap || helper.isToneModifier(next)) {
        // keycap and modifier, simple consumed cases
        out.push(next);
        ++i;
      }

      if (points[i + 1] !== helper.runeZWJ) {
        break;
      }
      ++i;
      const after = points[i + 1];
      if (start === helper.runeZWJ || helper.isTagRune(after) || helper.isFlagPoint(after)) {
        break;  // invalid ZWJ sequence, don't include
      }
      out.push(after);
      ++i;
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
