// As of 2026-03-23, the "v" flag (and RGI_Emoji) is supported by 91.29%.

import { buildFontEmojiCheck } from './support-font.ts';

const supportRGIEmoji: RegExp = /^\p{RGI_Emoji}$/v;

const buildSupportSingleEmoji = () => {
  let fallback = (s: string): boolean | undefined => false;

  if (typeof window !== 'undefined') {
    fallback = buildFontEmojiCheck();
  }

  return (s: string) => {
    if (supportRGIEmoji.test(s)) {
      return true;
    }
    return fallback(s);
  };
};

/**
 * Is the singular passed emoji recognized by the current environment?
 *
 * If this returns `undefined`, you should wait for a rAF (possibly more).
 * This will fire in the fallback font case.
 */
export const supportsSingleEmoji = buildSupportSingleEmoji();
