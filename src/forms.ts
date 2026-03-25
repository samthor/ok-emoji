import { runeZWJ } from './const.ts';

/**
 * Split the input string into an array of codepoints.
 * Not specifically to do with emoji.
 */
export function codepointsFor(s: string): number[] {
  let i = 0;
  const len = s.length;

  const points: number[] = [];

  // This is 40% faster than using `Array.from` and so on.
  while (i < len) {
    const r = s.codePointAt(i) ?? 0;
    if (r > 0xffff) {
      i += 2; // surrogate pair
    } else {
      ++i;
    }
    points.push(r);
  }

  return points;
}

/**
 * Counts emoji from a long string, as they are to be rendered.
 *
 * This can give different lengths based on the two-rune flags supported by the environment.
 * Pass {@link supportFlag} if needed, otherwise "all" flags will be treated as one character.
 */
export function countEmojiRender(
  s: string,
  supportFlag?: (a: number, b: number) => boolean | undefined,
): number {
  supportFlag ??= () => true;

  let cp = codepointsFor(unqualifyEmoji(s));
  let count = 0;

  while (cp.length) {
    ++count;

    // consume normal flag
    if (isFlagPartCodePoint(cp[0])) {
      if (!isFlagPartCodePoint(cp[1] || 0)) {
        // not a pair
        cp = cp.slice(1);
      } else if (!supportFlag(cp[0], cp[1])) {
        // unsupported
        cp = cp.slice(1);
      } else {
        // flag
        cp = cp.slice(2);
      }
      continue;
    }

    // consume region flag
    if (cp[0] === 0x1f3f4 && isTag(cp[1])) {
      let i = 1;
      while (cp[i]) {
        if (!isTag(cp[i])) {
          if (cp[i] === 0xe007f) {
            ++i;
          }
          break;
        }
        ++i;
      }

      cp = cp.slice(i);
      continue;
    }

    // consume keycap
    if (cp[1] === 0x20e3) {
      cp = cp.slice(2);
      continue;
    }

    // consume normal (+ZWJ)
    while (cp.length) {
      if (isSkinToneModifier(cp[1])) {
        cp = cp.slice(2);
      } else {
        cp = cp.slice(1);
      }

      if (cp[0] !== 0x200d) {
        break;
      }
      cp = cp.slice(1);
    }
  }

  return count;
}

function isTag(r: number) {
  return r >= 0xe0020 && r <= 0xe007e;
}

const emojiRe = /^\p{Emoji}$/u;
const emojiNeedsQualifierRe = /^\P{Emoji_Presentation}$/u;

/**
 * Returns whether the given single emoji codepoint needs a qualifier.
 *
 * Returns `undefined` if the environment does not believe this is an emoji.
 */
export function mustQualify(r: number): boolean | undefined {
  const s = String.fromCodePoint(r);
  if (!emojiRe.test(s)) {
    return undefined;
  }
  return emojiNeedsQualifierRe.test(s);
}

/**
 * Builds a helper which qualifies a string which may contain emoji.
 */
export function qualifyEmojiString(raw: string): string {
  const cp = codepointsFor(raw);

  const out: number[] = [];
  for (let i = 0; i < cp.length; ++i) {
    const x = cp[i];
    if (x === runeZWJ) {
      continue;
    }
    out.push(x);

    // tone acts as qualifier
    if (isSkinToneModifier(cp[i + 1] ?? 0)) {
      continue;
    }

    // otherwise, add a ZWJ
    if (mustQualify(x)) {
      out.push(runeZWJ);
    }
  }

  return String.fromCodePoint(...out);
}

/**
 * Unqualify this emoji (singular or multiple).
 * Just removes all ZWJ characters.
 */
export function unqualifyEmoji(x: string): string {
  return x.replaceAll(String.fromCodePoint(runeZWJ), '');
}

/**
 * Filters the codepoints of this string to the skin tone modifiers.
 *
 * If they are all the same, returns a single modifier (still in an array).
 */
export function tonesForEmoji(s: string): number[] {
  const out = codepointsFor(s).filter((r) => isSkinToneModifier(r));
  for (let i = 1; i < out.length; ++i) {
    if (out[i] !== out[0]) {
      return out;
    }
  }
  return [out[0]];
}

/**
 * Returns if the passed rune is one of the skin tone modifiers.
 */
export function isSkinToneModifier(r: number) {
  return r >= 0x1f3fb && r <= 0x1f3ff;
}

/**
 * Returns if the passed rune is one of the A-Z flag control codes.
 */
export function isFlagPartCodePoint(r: number) {
  return r >= 127462 && r <= 127487;
}
