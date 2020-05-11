/**
 * @fileoverview Helpers to expando and deexpando a small number of emoji.
 *
 * These are emoji such as "woman and man holding hands", which have a short representation yet
 * their variants (e.g., with varied skin tone) are fully expanded. This code helps to 'expando'
 * these short versions for better processing, and 'deexpando' others to their simple versions.
 */

import * as helper from './helper.js';

const runeHandshake = 0x1f91d;
const runeHeart = 0x2764;
const runeKiss = 0x1f48b;

/**
 * @type {!Array<number|!Array<number>>} maps simple old-style emoji to their effective expansion
 */
const expandosSource = [
  // "women holding hands"
  0x1f46d, [helper.runePersonWoman, runeHandshake, helper.runePersonWoman],
  // "men holding hands"
  0x1f46c, [helper.runePersonMan, runeHandshake, helper.runePersonMan],
  // "woman and man holding hands"
  0x1f46b, [helper.runePersonWoman, runeHandshake, helper.runePersonMan],
  // "kiss" (implied neutral)
  0x1f48f, [helper.runePerson, runeHeart, runeKiss, helper.runePerson],
  // "couple with heart" (implied neutral)
  0x1f491, [helper.runePerson, runeHeart, helper.runePerson],
];


const expandos = new Map();
for (let i = 0; i < expandosSource.length; i += 2) {
  const source = expandosSource[i];
  const expando = expandosSource[i+1];
  expandos.set(source, expando);
}


/**
 * Expand from a real emoji to its convertible representation. Modifies the passed array in-place.
 *
 * @param {!Array<number>} source
 * @return {boolean} if there was a change
 */
export function expando(source) {
  if (source.length > 2) {
    return false;
  }

  let tone = 0;
  if (source.length === 2) {
    if (!helper.isToneModifier(source[1])) {
      // can only be a single point, or a single point plus modifier
      return false;
    }
    tone = source[1];
  }

  const data = expandos.get(source[0]);
  if (data === undefined) {
    return false;
  }

  source.splice(0, source.length, ...data);
  if (tone !== 0) {
    // splice in skintone after first point and last point
    source.splice(1, 0, tone);
    source.splice(source.length, 0, tone);
  }
  return source;
}

/**
 * Deexpand from a convertible representation to a real emoji.
 *
 * @param {!Array<number>} source
 * @return {boolean} if there was a change
 */
export function deexpando(source) {
  // This just works by manually checking all the cases. 

  if (source.length < 3 || !helper.isGenderPerson(source[0])) {
    return false;
  }

  const headPerson = source[0];

  // Finds the optional skin tone after the first gender person. We only deexpando if skin tone of
  // both people is the same (including none).
  let i = 1;
  let headTone = 0;
  if (helper.isToneModifier(source[1])) {
    headTone = source[1];
    i = 2;
  }

  // Determine whether this is a valid expanded emoji. This is all manual because there's only ~5
  // cases right now.
  let mode = source[i];
  if (mode === runeHandshake) {
    if (headPerson === helper.runePerson) {
      return false;  // only for F/M holding hands
    }
  } else if (mode === runeHeart) {
    if (headPerson !== helper.runePerson) {
      return false;  // only for neuter kiss/couple
    }
    if (source[i + 1] === runeKiss) {
      mode = runeKiss;
      ++i;
    }
  } else {
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
  if (mode === runeHandshake) {
    if (headPerson === helper.runePersonWoman) {
      if (tailPerson === helper.runePersonWoman) {
        output = 0x1f46d;  // "women holding hands"
      } else if (tailPerson === helper.runePersonMan) {
        output = 0x1f46b;  // "woman and man holding hands"
      }
    } else if (headPerson === helper.runePersonMan && tailPerson === headPerson) {
      output = 0x1f46c;  // "men holding hands"
    }
    // skipped options: m/p, w/p, m/f (it's always f/m)
  } else if (tailPerson === helper.runePerson) {
    // either "couple with heart" or "kiss" (both neutral)
    output = (mode === runeHeart ? 0x1f491 : 0x1f48f);
  }
  if (output === 0) {
    return false;
  }

  // We found a match! Swap out the source content for the real emoji.
  source.splice(0, source.length, output);
  if (tailTone) {
    source.push(tailTone);
  }
  return true;
}
