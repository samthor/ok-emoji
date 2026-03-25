// As of 2026-03-23, the "v" flag (and RGI_Emoji) is supported by 91.29%.

const supportRGIEmoji: RegExp = /^\p{RGI_Emoji}$/v;

/**
 * Is the singular passed emoji recognized by the current environment?
 */
export const supportsSingleEmoji = (s: string): boolean => supportRGIEmoji.test(s);
