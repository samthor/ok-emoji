
import {iterate, split, join, single} from './encoding.js';
import {jsdecode} from './string.js';
import * as helper from './helper.js';
import {
  multi as multiSource,
  parts as partsSource,
  professions as professionsSource,
  unicode12,
  unicode13,
} from './raw/defs.js';
import {singleBase} from './variants.js';
import {isFlag} from './flags.js';

const buildStringHas = (source, ...extra) => {
  const data = split(source).map(single);
  const s = /** @type {!Set<string>} */ (new Set(data));
  extra.forEach((e) => s.add(e));
  return (check) => s.has(check);
};

const unicode12Has = buildStringHas(unicode12);
const unicode13Has = buildStringHas(unicode13);

// nb. add base "shaking hands" as it's not otherwise included (part of weird assembly)
const multiHas = buildStringHas(
    multiSource,
    single([helper.runePerson, helper.runeHandshake, helper.runePerson]),
);

const partsSet = new Set(Array.from(jsdecode(partsSource)));

const professionsSet = new Set(Array.from(jsdecode(professionsSource)));

// add skin tones for now
for (let r = 0x1f3fb; r <= 0x1f3ff; ++r) {
  partsSet.add(r);
}

/**
 * Normalize the passed emoji, removing non-emoji characters and stripping gender where possible.
 * Emoji is a living standard, so the output normalization might change (improve?) between versions.
 *
 * TODO: this normalizes all "family" emoji into "NUCLEAR FAMILY". This might not be right.
 *
 * TODO: This will remove zero-width flag character hacks
 *
 * @param {string} raw
 * @return {{s: string, length: number, unknownMulti: boolean}}
 */
export function normalize(raw) {
  let unknownMulti = false;  // unknown ZWJ'ed emoji
  const out = [];

  const checkMulti = (part) => {
    switch (part.length) {
      case 1:
        return false;
      case 2:
        if (isFlag(part[0], part[1])) {
          return true;
        }
        if (part[0] === helper.runePerson && professionsSet.has(part[1])) {
          return true;
        }
        break;
    }

    const joined = single(part);
    if (multiHas(joined)) {
      return true;  // return early as e.g. "KEYCAP ONE" is valid but its parts are not
    }

    unknownMulti = true;
    return false;
  };

outer:
  for (let part of iterate(raw)) {
    part = singleBase(part);

    if (checkMulti(part)) {
      out.push(part);
      continue;
    }

    for (const p of part) {
      if (!partsSet.has(p)) {
        continue outer;
      }
    }
    out.push(part);
  }

  return {s: join(out), length: out.length, unknownMulti};
}

/**
 * Denormalizes the passed emoji for old versions of the emoji spec. This is non-determinstic as it
 * returns random genders where neutral ones were impossible.
 *
 * This removes emoji we know were introduced in later versions. It doesn't modify emoji we don't
 * know about. (This is different to old code, which measured everything.)
 *
 * TODO(samthor): This isn't super useful for restricting variants as it just spews out more things.
 * We could just remove any emoji that _changes_, but ugh.
 *
 * @param {string} raw
 * @param {number} version integer version (assumes all minors, e.g., 12 => 12.1)
 * @return {string}
 */
export function denormalizeForSupport(raw, version=13) {
  if (version >= 13) {
    return raw;
  }

  // this only effects people heads
  // const check = String.fromCodePoint(helper.runePerson, helper.runeZWJ);
  // if (raw.indexOf(check) === -1) {
  //   return raw;
  // }

  const rewriter = (part) => {
    // TODO: when this was just rewriting, it only needed people
    // if (part[0] !== helper.runePerson) {
    //   return part;
    // }
    if (version >= 13) {
      return part;
    }

    const s = single(part);

    // overrides for Emoji 13
    if (version < 13) {
      if (part.length === 2 && part[0] === helper.runePerson && part[1] === helper.runeHolidayTree) {
        // "MX CLAUS" to m or f
        return [choiceFromOptions(0x1f385, 0x1f936)];
      }
      if (unicode13Has(s)) {
        return [];
      }
    }

    // overrides for Emoji 12
    if (version < 12) {
      if (part.length === 3 && part[0] === helper.runePerson && part[1] === helper.runeHandshake && part[2] === helper.runePerson) {
        // "PEOPLE HOLDING HANDS" map to mm, fm, or ff
        return [choiceFromOptions(0x1f46d, 0x1f46b, 0x1f46c)];
      }

      // don't override "PERSON FEEDING BABY", all genders added in 13.0
      // TODO(samthor): as we run unicode13Has above, this should never actually get here?
      if (part.length === 2 && part[0] === helper.runePerson && part[1] !== 0x1f37c) {
        return [choiceFromOptions(helper.runePersonMan, helper.runePersonWoman), part[1]];
      }

      if (unicode12Has(s)) {
        return [];
      }
    }

    return part;
  };

  return join(split(raw).map(rewriter));
}

/**
 * Helper to choose a random option.
 *
 * @param {!Array<number>} arr
 * @return {number}
 */
function choiceFromOptions(...arr) {
  const index = Math.floor(Math.random() * arr.length);
  return arr[index];
}
