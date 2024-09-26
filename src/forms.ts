/**
 * Split the input string into an array of codepoints. Not specifically to do with emoji.
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
 * Builds a helper which returns whether the given single emoji codepoint needs a qualifier.
 * Does not return a function if this is not supported here (pre-2020).
 *
 * The helper returns `undefined` if this is not seen as an emoji, but `true` or `false` otherwise.
 */
export function buildPlatformMustQualify(): undefined | ((r: number) => boolean | undefined) {
  let emojiRe: RegExp;
  let emojiNeedsQualifierRe: RegExp;

  try {
    emojiRe = /^\p{Emoji}$/u;
    emojiNeedsQualifierRe = /^\P{Emoji_Presentation}$/u;
  } catch {
    return undefined;
  }

  return (r: number) => {
    const s = String.fromCodePoint(r);
    if (!emojiRe.test(s)) {
      return undefined;
    }
    return emojiNeedsQualifierRe.test(s);
  };
}

/**
 * Builds a helper which qualifies an emoji string. This is a builder as you may not have
 * `\p{Emoji}` or `\p{Emoji_Presentation}` support.
 */
export function buildQualifyEmoji(
  mustQualify: (r: number) => boolean | undefined,
): (raw: string) => string {
  return (raw) => {
    const cp = codepointsFor(raw);

    const out: number[] = [];
    for (let i = 0; i < cp.length; ++i) {
      const x = cp[i];
      if (x === 0xfe0f) {
        continue;
      }
      out.push(x);

      // tone acts as qualifier
      if (isSkinToneModifier(cp[i + 1] ?? 0)) {
        continue;
      }

      // otherwise, add 0xfe0f
      if (mustQualify(x)) {
        out.push(0xfe0f);
      }
    }

    return String.fromCodePoint(...out);
  };
}

/**
 * Unqualify this emoji (singular or multiple). Just removes all `0xfe0f` characters.
 */
export function unqualifyEmoji(x: string): string {
  return x.replaceAll('\u{fe0f}', '');
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
