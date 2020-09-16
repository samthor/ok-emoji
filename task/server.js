import {iterate, split, single} from '../src/encoding.js'
import {
  parts as partsSource,
  multi as multiSource,
  professions as professionsSource,
} from '../src/raw/defs.js';
import {isFlag} from '../src/flags.js';
import * as helper from '../src/helper.js';
import {jsdecode} from '../src/string.js';
import {expando} from '../src/expando.js';



// Valid parts. Contains most things.
const partsSet = new Set(Array.from(jsdecode(partsSource)));

// Grab professions (used for ZWJ validation), including future professions.
const professionsSet = new Set(Array.from(jsdecode(professionsSource)));
[helper.runeCrown, helper.runeMusicalNotes].forEach((extra) => professionsSet.add(extra));

// ZWJ emoji. This is actually not canonical emoji, it just contains runes slammed together.
// Add person group cases (holding hands, heart, kiss).
const multiSet = new Set(split(multiSource).map((points) => String.fromCodePoint.apply(null, points)));
multiSet.add(String.fromCodePoint(helper.runePerson, helper.runeHandshake, helper.runePerson));
multiSet.add(String.fromCodePoint(helper.runePerson, helper.runeHeart, helper.runePerson));
multiSet.add(String.fromCodePoint(helper.runePerson, helper.runeHeart, helper.runeKiss, helper.runePerson));

const singleBaseSource = [
  helper.runePerson, helper.runePersonWoman, helper.runePersonMan,
  0x1f9d2, 0x1f467, 0x1f466,  // child, girl, boy
  0x1f9d3, 0x1f475, 0x1f474,  // old {adult,woman,man}
];

const singleBase = new Map();
for (let i = 0; i < singleBaseSource.length; i += 3) {
  const base = singleBaseSource[i+0];
  singleBase.set(singleBaseSource[i+1], base);
  singleBase.set(singleBaseSource[i+2], base);
}

/**
 * Normalizes a single point. Used as a helper below.
 *
 * @param {number} point
 * @return {string} server string (no VS16 etc)
 */
function internalNormalizePoint(point) {
  if (helper.isGender(point) || helper.isToneModifier(point)) {
    return 0;
  }
  const base = singleBase.get(point);
  if (base !== undefined) {
    return base;
  }
  return point;
}

/**
 * Normalizes a single emoji run. Returns a server string (no VS16 etc), possibly the empty string.
 *
 * @param {!Array<number>} points
 * @return {string}
 */
function normalizeSingle(points) {
  // Match valid flags. Disallow invalid ones.
  if (helper.isFlagPoint(points[0])) {
    if (points.length === 2 && isFlag(points[0], points[1])) {
      return String.fromCodePoint(points[0], points[1]);
    }
    return '';
  }

  // Match family and return "NUCLEAR FAMILY".
  if (points.length >= 2 && helper.isFamilyMember(points[0]) && helper.isFamilyMember(points[1])) {
    return '\u{1f46a}';
  }

  // Normalize all points, removing gender and other options.
  points = points.map(internalNormalizePoint).filter((x) => x !== 0);
  if (points.length === 0) {
    return '';
  }

  // Check validity of ZWJ'ed emoji.
  if (points.length !== 1) {
    if (points.length === 2 && points[0] === helper.runePerson && professionsSet.has(points[1])) {
      return single(points);
    }
    const check = String.fromCodePoint.apply(null, points);
    if (multiSet.has(check)) {
      return single(points);  // cand is just points stuck together, really format it here
    }
    return '';
  }

  // Match expandos (old single rune to multiple). At this point we have no gender/tone points
  // so the expando code won't retain it. All expandos are considered valid.
  if (expando(points)) {
    points = points.map(internalNormalizePoint);  // expandos include explicit gender
    return single(points);
  }

  // We have a single, successful point. Let's see if it's even a valid part at all.
  if (partsSet.has(points[0])) {
    return single(points);
  }

  return '';
}

/**
 * Normalizes completely untrusted user data. Not designed to be run in a user's browser. Returns a
 * formatted emoji, including ZWJs and VS16s as needed.
 *
 * This updates the passed emoji, removing non-emoji characters, as well as stripping gender and
 * skin tone. It also removes unknown ZWJ'ed emoji, but expandos old-style single points into
 * their longer form (e.g., "SANTA" => "MAN" "ZWJ" "HOLIDAY TREE").
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
 * @return {!Array<string>}
 */
export function normalizeForStorage(raw) {
  const out = [];

  for (const initial of iterate(raw)) {
    const update = normalizeSingle(initial);
    if (update.length !== 0) {
      out.push(update);
    }
  }

  return out;
}