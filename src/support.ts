import { buildCache } from './helper.ts';
import { buildSupportsSingleEmojiLegacy } from './support-legacy.ts';

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
  : (() => {
      const support = buildSupportsSingleEmojiLegacy();
      if (!support) {
        return () => undefined;
      }
      return buildCache(support);
    })();

/**
 * Is this code using the legacy emoji checker?
 *
 * This is before browsers supported the `/v` flag on regular expressions:
 *   https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/unicodeSets
 */
export const usingLegacyEmojiCheck = !supportRGIEmoji;
