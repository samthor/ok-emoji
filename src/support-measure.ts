import { codepointsFor, isFlagPartCodePoint, isSkinToneModifier } from './forms.ts';

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

/**
 * Check if the emoji is supported by measuring it. May return `undefined` if no useful answer can
 * be determined.
 *
 * Only works in browser environments, will always return `undefined` outside this.
 */
export const supportsEmojiByMeasure = buildSupportsEmojiByMeasure();
