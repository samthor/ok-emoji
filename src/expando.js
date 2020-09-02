/**
 * @fileoverview Helpers to expando and deexpando a small number of emoji.
 *
 * These are emoji such as "woman and man holding hands", which have a short representation yet
 * their variants (e.g., with varied skin tone) are fully expanded. This code helps to 'expando'
 * these short versions for better processing, and 'deexpando' others to their simple versions.
 *
 * This is updated for Emoji 13.0.
 */

import * as helper from './helper.js';


const expandoWomenHoldingHands = 0x1f46d;
const expandoMenHoldingHands = 0x1f46c;
const expandoWomanAndManHoldingHands = 0x1f46b;
const expandoKiss = 0x1f48f;
const expandoCoupleWithHeart = 0x1f491;
const expandoMrsClaus = 0x1f936;
const expandoSantaClaus = 0x1f385;


/**
 * @type {!Array<number|!Array<number>>} maps simple old-style emoji to their effective expansion
 */
const expandosSource = [
  // "women holding hands"
  expandoWomenHoldingHands, [helper.runePersonWoman, helper.runeHandshake, helper.runePersonWoman],
  // "men holding hands"
  expandoMenHoldingHands, [helper.runePersonMan, helper.runeHandshake, helper.runePersonMan],
  // "woman and man holding hands"
  expandoWomanAndManHoldingHands, [helper.runePersonWoman, helper.runeHandshake, helper.runePersonMan],
  // "kiss" (implied neutral)
  expandoKiss, [helper.runePerson, helper.runeHeart, helper.runeKiss, helper.runePerson],
  // "couple with heart" (implied neutral)
  expandoCoupleWithHeart, [helper.runePerson, helper.runeHeart, helper.runePerson],
  // "mrs claus"
  expandoMrsClaus, [helper.runePersonWoman, helper.runeHolidayTree],
  // "santa claus"
  expandoSantaClaus, [helper.runePersonMan, helper.runeHolidayTree],
];


const expandos = new Map();
for (let i = 0; i < expandosSource.length; i += 2) {
  const source = expandosSource[i];
  const expando = expandosSource[i+1];
  expandos.set(source, expando);
}


/**
 * Expand from a real, single emoji to its convertible representation. Modifies the passed array
 * in-place.
 *
 * @param {!Array<number>} source
 * @return {boolean} if there was a change
 */
export function expando(source) {
  let tone = 0;

  switch (source.length) {
    case 1:
      break;
    case 2:
      if (!helper.isToneModifier(source[1])) {
        // can only be a single point, or a single point plus modifier
        return false;
      }
      tone = source[1];
      break;
    default:
      return false;
  }

  const data = expandos.get(source[0]);
  if (data === undefined) {
    return false;
  }

  source.splice(0, source.length, ...data);
  if (tone !== 0) {
    // splice in skintone after first point
    source.splice(1, 0, tone);
    if (data.length > 2) {
      // and splice in after last point (this excludes Santa family, single person only)
      source.splice(source.length, 0, tone);
    }
  }
  return source;
}

/**
 * Deexpand from a convertible representation of a single emoji to a real emoji. This just works by
 * manually checking all the cases for now. Modifies in-place.
 *
 * @param {!Array<number>} source
 * @return {boolean} if there was a change
 */
export function deexpando(source) {
  // all expandos are minimum 2-points, and start with a person
  if (source.length < 2 || !helper.isGenderPerson(source[0])) {
    return false;
  }

  const headPerson = source[0];

  // Finds the optional skin tone after the first gender person. We only deexpando if skin tone of
  // both people is the same (including none).
  let i = 1;
  let headTone = 0;
  if (helper.isToneModifier(source[1])) {
    if (source.length === 2) {
      return false;  // this is just a person with a skin tone
    }
    headTone = source[1];
    i = 2;
  }

  // Determine whether this is a valid expanded emoji. This is all manual because there's only ~7
  // cases right now.
  let mode = source[i];

  switch (mode) {
    case helper.runeHolidayTree:
      // the Claus family is just a single person so we don't follow the below logic
      if (headPerson === helper.runePerson) {
        return false;  // "mx claus" is the expanded version, don't change
      }
      if (i + 1 !== source.length) {
        return false;  // don't know what this is
      }
      source.splice(0, source.length, headPerson === helper.runePersonMan ? expandoSantaClaus : expandoMrsClaus);
      if (headTone) {
        source.push(headTone);
      }
      return true;

    case helper.runeHandshake:
      if (headPerson === helper.runePerson) {
        return false;  // only for F/M holding hands
      }
      break;

    case helper.runeHeart:
      if (headPerson !== helper.runePerson) {
        return false;  // only for neuter kiss/couple
      }
      if (source[i + 1] === helper.runeKiss) {
        mode = helper.runeKiss;
        ++i;
      }
      break;

    default:
      return false;
  }

  // Check that this emoji also ends with a person of the same skintone.
  const tailPerson = source[i+1] || 0;  // we could be past end of array
  if (!helper.isGenderPerson(tailPerson)) {
    return false;
  }
  const tailTone = source[i+2] || 0;
  if (tailTone !== headTone) {
    return false;  // different tones can't be reduced
  }

  let output = 0;
  if (mode === helper.runeHandshake) {
    if (headPerson === helper.runePersonWoman) {
      if (tailPerson === helper.runePersonWoman) {
        output = expandoWomenHoldingHands;  // "women holding hands"
      } else if (tailPerson === helper.runePersonMan) {
        output = expandoWomanAndManHoldingHands;  // "woman and man holding hands"
      }
    } else if (headPerson === helper.runePersonMan && tailPerson === headPerson) {
      output = expandoMenHoldingHands;  // "men holding hands"
    }
    // skipped options: m/p, w/p, m/f (it's always f/m)
  } else if (tailPerson === helper.runePerson) {
    // either "couple with heart" or "kiss" (both neutral)
    output = (mode === helper.runeHeart ? expandoCoupleWithHeart : expandoKiss);
  }
  if (output === 0) {
    return false;
  }

  // We found a match! Swap out the source content for the real emoji.
  source.splice(0, source.length, output);
  if (tailTone) {
    source.push(tailTone);  // could use headTone, they must be the same
  }
  return true;
}
