import {
  buildPlatformMustQualify,
  codepointsFor,
  isFlagPartCodePoint,
  isSkinToneModifier,
} from './forms.ts';

/**
 * Builds a support emoji checker.
 */
export function buildSupportsSingleEmojiLegacy() {
  const mustQualify = buildPlatformMustQualify();
  if (!mustQualify) {
    return undefined;
  }

  // if mustQualify can be created, we assume this can too
  const emojiModifierBaseRe = /^\p{Emoji_Modifier_Base}$/u;

  const supportsEmojiByMeasure = buildSupportsEmojiByMeasure();

  return (raw: string): boolean | undefined => {
    if (!raw.length) {
      return false;
    }

    const measureAnswer = supportsEmojiByMeasure(raw);
    if (measureAnswer !== undefined) {
      return measureAnswer;
    }

    if (isKeycapLeft(raw.codePointAt(0)!)) {
      // keycaps, just assume yes (Unicode 0.6)
      const cp = codepointsFor(raw);
      return cp.length === 3 && cp[1] === 0xfe0f && cp[2] === 0x20e3;
    }

    if (raw.includes('\u{200d}')) {
      // this is a ZWJ - we literally don't have sequence support, bail
      return undefined;
    }

    // make sure this actually starts with an emoji
    const cp = codepointsFor(raw);
    const needsQualifier = mustQualify(cp[0]);
    if (needsQualifier === undefined) {
      return false; // not actually an emoji
    }

    // check single case
    if (cp.length === 1) {
      return !needsQualifier;
    }

    // check multiple case
    if (cp.length === 2) {
      if (emojiModifierBaseRe.test(String.fromCodePoint(cp[0])) && isSkinToneModifier(cp[1])) {
        return true;
      } else if (cp[1] === 0xfe0f) {
        return needsQualifier;
      }
    }

    return undefined;
  };
}

function buildSupportsEmojiByMeasure() {
  let c: OffscreenCanvas | HTMLCanvasElement | undefined;
  try {
    c = new OffscreenCanvas(1, 1);
  } catch {
    try {
      c = document.createElement('canvas');
    } catch {}
  }

  const ctx = c?.getContext('2d');
  if (!ctx) {
    return () => undefined;
  }

  const measure = (s: string) => ctx.measureText(s).width;
  const doubleFlagPartWidth = measure('🇨') * 2;

  return (s: string): undefined | boolean => {
    if (!s.length) {
      return false;
    }
    const start = s.codePointAt(0)!;

    // flag, check single vs double
    if (isFlagPartCodePoint(start) && s.length > 2) {
      // This isn't always strictly true; some environments show a flag with a question mark if
      // invalid points are passed. This is probably fine though, that's a kind of valid.
      return measure(s) < doubleFlagPartWidth;
    }

    // something with ZWJ, measure single vs whole
    const parts = s.split('\u{200d}');
    if (parts.length !== 1) {
      const allWidth = measure(s);

      let totalPartsWidth = 0.0;
      for (const p of parts) {
        totalPartsWidth += measure(p);
        if (totalPartsWidth > allWidth) {
          return true;
        }
      }

      return false;
    }

    // check whether skin tone supported
    const cp = codepointsFor(s);
    if (cp.length === 2 && isSkinToneModifier(cp[1])) {
      const withoutModifier = measure(String.fromCodePoint(cp[0]));
      const withModifier = measure(s);
      return withoutModifier === withModifier;
    }

    return undefined;
  };
}

function isKeycapLeft(r: number) {
  return (r >= 0x30 && r <= 0x39) || r === 0x23 || r === 0x2a;
}
