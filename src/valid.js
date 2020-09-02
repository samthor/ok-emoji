
import {iterate, split, join, single} from './encoding.js';
import {jsdecode} from './string.js';
import {runePerson, runeHandshake} from './helper.js';
import {
  multi as multiSource,
  parts as partsSource,
  professions as professionsSource,
} from './raw/defs.js';
import {singleBase} from './variants.js';
import { isFlag } from './flags.js';

const multiSet = new Set();
const multiAll = split(multiSource);
multiAll.forEach((points) => {
  multiSet.add(single(points));
});

// nb. add base "shaking hands" as it's not otherwise included (part of weird assembly)
multiSet.add(single([runePerson, runeHandshake, runePerson]));

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
        if (part[0] === runePerson && professionsSet.has(part[1])) {
          return true;
        }
        break;
    }

    const joined = single(part);
    if (multiSet.has(joined)) {
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
