const emojiRe = /^\p{Emoji}$/u;
const emojiNeedsQualifierRe = /^\P{Emoji_Presentation}$/u;
const emojiModifierBaseRe = /^\p{Emoji_Modifier_Base}$/u;

/**
 * Split the input string into an array of codepoints. Not specifically to do with emoji.
 */
export function codepointsFor(x: string): number[] {
  return Array.from(x).map((y) => y.codePointAt(0)!);
}

/**
 * Returns whether the given single emoji codepoint needs a qualifier.
 *
 * Returns `undefined` if this is not seen as an emoji.
 */
export function emojiCodePointNeedsQualifier(r: number) {
  const s = String.fromCodePoint(r);
  if (!emojiRe.test(s)) {
    return undefined;
  }
  return emojiNeedsQualifierRe.test(s);
}

/**
 * Whether this emoji can have a skin tone applied to it.
 */
export function emojiCodePointModifierBase(r: number) {
  return emojiModifierBaseRe.test(String.fromCodePoint(r));
}

/**
 * Returns the qualified form of this emoji (singular or multiple). This just inserts `0xfe0f`
 * characters where they are technically required.
 *
 * This relies on the Unicode group support `\p{Emoji}` and `\p{Emoji_Presentation}`. Unknown emoji
 * will actually be actively _unqualified_.
 *
 * Does this matter in practice? Who knows.
 */
export function qualifyEmoji(x: string): string {
  const cp = codepointsFor(x);

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
    if (emojiCodePointNeedsQualifier(x)) {
      out.push(0xfe0f);
    }
  }

  return String.fromCodePoint(...out);
}

/**
 * Unqualify this emoji (singular or multiple). Just removes all `0xfe0f` characters.
 */
export function unqualifyEmoji(x: string): string {
  return x.replaceAll('\u{fe0f}', '');
}

/**
 * Filters the codepoints of this string to the skin tone modifiers.
 */
export function tonesForEmoji(s: string): number[] {
  return codepointsFor(s).filter((r) => isSkinToneModifier(r));
}

export function isSkinToneModifier(r: number) {
  return r >= 0x1f3fb && r <= 0x1f3ff;
}

export function isFlagPartCodePoint(r: number) {
  return r >= 127462 && r <= 127487;
}

export function isKeycapLeft(r: number) {
  return (r >= 0x30 && r <= 0x39) || r === 0x23 || r === 0x2a;
}
