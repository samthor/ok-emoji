import {iterate, split, single} from '../src/encoding.js'
import {
  parts as partsSource,
  multi as multiSource,
} from '../src/raw/defs.js';
import {isFlag} from '../src/flags.js';
import * as helper from '../src/helper.js';
import {jsdecode} from '../src/string.js';
import {expando} from '../src/expando.js';
import {normalizePointAll} from '../src/normalize.js';
import {validPersonGroup} from '../src/group.js';
import {isProfession} from '../src/person.js';

// Valid parts. Contains most things, including roles.
const partsSet = new Set(Array.from(jsdecode(partsSource)));

// ZWJ emoji. This is actually not canonical emoji, it just contains runes slammed together.
const multiSet = new Set(split(multiSource).map((points) => String.fromCodePoint.apply(null, points)));


/**
 * Ensures that the passed emoji is valid, removing skin tone modifiers. May return the input array.
 *
 * @param {!Array<number>} points
 * @return {?Array<number>}
 */
function matchSingle(points) {
  // Match valid flags. Disallow invalid ones.
  if (helper.isFlagPoint(points[0])) {
    if (points.length === 2 && isFlag(points[0], points[1])) {
      return points;
    }
    return null;
  }

  points = points.filter((x) => !helper.isToneModifier(x));
  if (points.length === 0) {
    return null;
  }

  // Check validity of ZWJ'ed emoji.
  if (points.length !== 1) {
    if (points.length === 2 && helper.isGenderPerson(points[0]) && isProfession(points[1])) {
      return points;
    }

    const check = String.fromCodePoint.apply(null, points);  // no gendered emoji here
    if (multiSet.has(check)) {
      return points;
    }

    // nb. This doesn't catch expandos but they're not in this branch anyway (length === 1).
    if (validPersonGroup(points)) {
      return points;
    }
    return null;
  }

  // Match expandos (old single rune to multiple). All expandos are considered valid.
  if (expando(points)) {
    return points;
  }

  // We have a single, successful point. Let's see if it's even a valid part at all.
  if (partsSet.has(points[0])) {
    return points;
  }

  return null;
}

/**
 * Normalizes completely untrusted user data. Not designed to be run in a user's browser. Returns a
 * an array of formatted emoji, including ZWJs and VS16s as needed. (This should just be joined as
 * string parts, but also provides a count of emoji.)
 *
 * This updates the passed emoji, removing non-emoji characters and unknown ZWJ'ed emoji. For
 * single emoji, this removes gender unless the emoji is one of the single bases
 * ("PERSON"/"WOMAN"/"MAN", same for "CHILD" and "OLDER PERSON"). For runs of emoji, this does not
 * modify gender. In all cases, this removes skin tone modifiers.
 *
 * This function avoids old-style single points in favour of expando'ed versions, e.g.:
 *  - "SANTA" => "MAN" "ZWJ" "HOLIDAY TREE"
 *  - ""
 *
 * There's also two emoji we map to potential/invalid runs to remove gender:
 *   "PRINCESS" and "PRINCE" => "PERSON" "CROWN"
 *   "WOMAN DANCING" and "MAN DANCING" => "PERSON" "MUSICAL NOTES"
 *
 * In the first case, this matches a proposal (https://www.unicode.org/L2/L2020/20189-person-wearing-crown.pdf).
 * In the second case, this matches an older discussion, which while out-of-date, lists this option
 * directly adjacent to the above "CROWN" suggestion (https://www.unicode.org/L2/L2019/19231-gendered-emoji-rec.pdf).
 *
 * Importantly, emoji is a living standard, so the output normalization may change or improve over
 * time.
 *
 * @param {string} raw
 * @param {boolean=} retainGender whether to always retain gender information
 * @return {!Array<string>}
 */
export function normalizeForStorage(raw, retainGender=undefined) {
  const out = [];

  for (const part of iterate(raw)) {
    const update = matchSingle(part);
    if (update !== null) {
      out.push(update);
    }
  }
  if (out.length === 0) {
    return [];
  }

  if (retainGender === undefined) {
    retainGender = (out.length !== 1);
  }

  if (!retainGender) {
    let solo = out[0];
    if (helper.isFamilyPoints(solo)) {
      // this is somewhat special but we revert to "NUCLEAR FAMILY" here to remove gender
      out[0] = [helper.runeNuclearFamily];
    } else if (solo.length !== 1) {
      solo = solo.map(normalizePointAll).filter((x) => x !== 0);
      out[0] = solo;
    }
  }

  return out.map(single);
}