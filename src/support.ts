import {
  codepointsFor,
  emojiCodePointModifierBase,
  emojiCodePointNeedsQualifier,
  isActsAsQualifier,
  isKeycapLeft,
  isSkinToneModifier,
} from './forms.ts';
import { supportsEmojiByMeasure } from './support-measure.ts';

const supportEmoji = /^\p{Emoji}$/u;

// RGI_Emoji is only supported from 2023-09-18 onwards (Safari, Chrome in 2023-04)
// ...one year later, caniuse says 86.11%

let supportRGIEmoji: RegExp | undefined;
try {
  supportRGIEmoji = /^\p{RGI_Emoji}$/v;
} catch {}

/**
 * Is the singular passed emoji recognized by the current environment?
 *
 * In legacy environments (before the `/v` regular expression flag), uses various fallback
 * mechanisms and may return `undefined`.
 */
export const supportsSingleEmoji = supportRGIEmoji
  ? (s: string) => supportRGIEmoji.test(s)
  : buildCache(supportsSingleEmojiLegacy);

/**
 * Checks whether the singular passed emoji is supported by the current environment. Uses
 * `\p{Emoji}` but not unicodeSets.
 */
export function supportsSingleEmojiLegacy(raw: string): boolean | undefined {
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
  const needsQualifier = emojiCodePointNeedsQualifier(cp[0]);
  if (needsQualifier === undefined) {
    return false; // not actually an emoji
  }

  // check single case
  if (cp.length === 1) {
    return !needsQualifier;
  }

  // check multiple case
  if (cp.length === 2) {
    if (emojiCodePointModifierBase(cp[0]) && isSkinToneModifier(cp[1])) {
      return true;
    } else if (cp[1] === 0xfe0f) {
      return needsQualifier;
    }
  }

  return undefined;
}

/**
 * Is this code using the legacy emoji checker?
 *
 * This is before browsers supported the `/v` flag on regular expressions:
 *   https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/unicodeSets
 */
export const usingLegacyEmojiCheck = supportRGIEmoji === null;

/**
 * Cache helper, just used for legacy for now.
 */
function buildCache(
  helper: (raw: string) => boolean | undefined,
): (raw: string) => boolean | undefined {
  const m = new Map<string, boolean | undefined>();

  return (raw: string) => {
    if (m.has(raw)) {
      return m.get(raw);
    }

    // laziest FIFO cache ever
    if (m.size === 2_000) {
      for (const firstKey of m.keys()) {
        m.delete(firstKey);
        break;
      }
    }

    const out = helper(raw);
    m.set(raw, out);
    return out;
  };
}
