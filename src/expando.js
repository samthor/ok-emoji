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
const expandoPrincess = 0x1f478;
const expandoPrince = 0x1f934;
const expandoWomanDancing = 0x1f483;
const expandoManDancing = 0x1f57a;

/**
 * @type {!Array<number|!Array<number>>} maps simple old-style emoji to their effective expansion
 */
const complexExpandoSource = [
  expandoWomenHoldingHands, [helper.runePersonWoman, helper.runeHandshake, helper.runePersonWoman],
  expandoMenHoldingHands, [helper.runePersonMan, helper.runeHandshake, helper.runePersonMan],
  expandoWomanAndManHoldingHands, [helper.runePersonWoman, helper.runeHandshake, helper.runePersonMan],
  expandoKiss, [helper.runePerson, helper.runeHeart, helper.runeKiss, helper.runePerson],
  expandoCoupleWithHeart, [helper.runePerson, helper.runeHeart, helper.runePerson],
];
const simpleExpandoSource = [
  [0, expandoMrsClaus, expandoSantaClaus], helper.runeHolidayTree,
  [0, expandoPrincess, expandoPrince], helper.runeCrown,
  [0, expandoWomanDancing, expandoManDancing, 0], helper.runeMusicalNotes,
];

const expandos = new Map();
const deexpandoSimple = new Map();

for (let i = 0; i < complexExpandoSource.length; i += 2) {
  const source = complexExpandoSource[i+0];
  const expando = complexExpandoSource[i+1];
  expandos.set(source, expando);
}
for (let i = 0; i < simpleExpandoSource.length; i += 2) {
  const source = simpleExpandoSource[i+0];
  const profession = simpleExpandoSource[i+1];

  const people = [helper.runePerson, helper.runePersonWoman, helper.runePersonMan];
  const data = people.map((person, i) => {
    const from = source[i];
    if (from !== 0) {
      expandos.set(from, [person, profession]);
    }
    return from;
  });
  deexpandoSimple.set(profession, data);
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

  const expanded = expandos.get(source[0]);
  if (expanded === undefined) {
    return false;
  }

  source.splice(0, source.length, ...expanded);
  if (tone !== 0) {
    // splice in skintone after first point
    source.splice(1, 0, tone);
    if (expanded.length > 2) {
      // and splice in after last point (this matches long groups with multiple people only)
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

  // Determine whether this is a valid expanded emoji. This is automated for the simple profession
  // expansion cases but has logic for the others.
  let mode = source[i];

  // Check simple mode. These are Santa, Crown, etc.
  const people = deexpandoSimple.get(mode);
  if (people !== undefined) {
    if (i + 1 !== source.length) {
      return false;  // don't know what this is
    }
    // simple mode
    let index = 0;
    switch (headPerson) {
      case helper.runeGenderFemale:
        index = 1;
        break;
      case helper.runePersonMan:
        index = 2;
        break;
    }

    const out = people[index];
    if (out === 0) {
      return false;
    }
    source.splice(0, source.length, out);
    if (headTone) {
      source.push(headTone);
    }
    return true;
  }

  switch (mode) {
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
