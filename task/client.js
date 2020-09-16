import {split, single} from '../src/encoding.js';
import {deexpando} from '../src/expando.js';
import * as helper from '../src/helper.js';
import {
  unicode11,
  unicode12,
  unicode13,
} from '../src/raw/defs.js';

export {default as determineEmojiSupport} from '../src/version.js';

const buildStringHas = (source) => {
  const data = split(source).map(single);
  const s = /** @type {!Set<string>} */ (new Set(data));
  return (check) => s.has(check);
};

const unicode11Has = buildStringHas(unicode11);
const unicode12Has = buildStringHas(unicode12);
const unicode13Has = buildStringHas(unicode13);

/**
 * Denormalizes server emoji for client based on the current Unicode version. This can modify or
 * even clear the incoming emoji completely, returning an empty string.
 *
 * TODO: seed gender choice
 *
 * @param {string} raw
 * @param {number} version
 * @return {string}
 */
export function restoreForClient(raw, version) {
  if (version <= 0) {
    return raw;  // do nothing
  }

  if (version >= 130) {
    // we only need to denormalize ZWJ'ed emoji, fast-path
    if (raw.indexOf('\u{200d}') === -1) {
      return raw;
    }
    // TODO: regexp for musical notes / crown
  }

  const rewriter = (part) => {
    if (deexpando(part)) {
      return single(part);  // all expandos result in ancient valid emoji
    }
    const s = single(part);  // TODO: what we get from the server is "correct" modulo expandos

    if (part.length === 2 && part[0] === helper.runePerson) {
      switch (part[1]) {
        case helper.runeHolidayTree:
          if (version >= 130) {
            return s;
          }
          // "MX CLAUS" to f or m
          return String.fromCodePoint(choiceFromOptions(0x1f936, 0x1f385));

        case helper.runeMusicalNotes:
          // "DANCER" to f or m
          return String.fromCodePoint(choiceFromOptions(0x1f483, 0x1f57a));

        case helper.runeCrown:
          // "ROYALTY" to f or m
          return String.fromCodePoint(choiceFromOptions(0x1f478, 0x1f934));
      }

      // gendered hair supported only in 121 (hair from 110)
      if (version < 121 && helper.isHairEmoji(part[1])) {
        if (version < 110) {
          return '';  // no hair emoji supported
        }
        const p = choiceFromOptions(helper.runePersonWoman, helper.runePersonMan);
        return String.fromCodePoint(p, '\u{200d}', part[1]);
      }
    }

    if (version >= 130) {
      return s;
    } else if (unicode13Has(s)) {
      return '';
    }

    // TODO: we treat 12.1 as minimum 12.x support
    if (version >= 121) {
      return s;
    }

    // neutral "PEOPLE HOLDING HANDS" added in 12.1
    if (part.length === 3 && part[0] === helper.runePerson && part[1] === helper.runeHandshake && part[2] === helper.runePerson) {
      return String.fromCodePoint(choiceFromOptions(0x1f46d, 0x1f46b, 0x1f46c));
    }
    if (unicode12Has(s)) {
      return '';
    }

    if (version >= 110) {
      return s;
    } else if (unicode11Has(s)) {
      return '';
    }

    // give up < E11.0
    return s;
  };

  return split(raw).map(rewriter).join('');
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