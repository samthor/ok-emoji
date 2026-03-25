import { personTypeAllData } from '../classify-description.ts';
import { expandAllDescription } from '../const.ts';

/**
 * Should the suffix always be used for this raw emoji name. Just hard-coded.
 */
export function alwaysPersonTypeSuffix(description: string) {
  return expandAllDescription.includes(description);
}

/**
 * Expands a 'person type' string into friendly name options.
 */
export function expandPersonTypeOptions(pt: string | undefined):
  | {
      prefix?: string;
      suffix: string;
    }
  | { prefix?: never; suffix?: never } {
  if (!pt) {
    return {};
  }

  const prefix: string | undefined = personTypeAllData[pt];

  // if this is [p]erson and [c]hildren, replace [p]erson -> [a]dult
  if (/^[pc]+$/.test(pt)) {
    pt = pt.replaceAll('p', 'a');
  }
  const suffix = [...pt]
    .map((each) => personTypeAllData[each])
    .filter((x) => x)
    .join(', ');

  return { prefix, suffix };
}

export function expandPersonType(pt: string | undefined, key: string) {
  const options = expandPersonTypeOptions(pt);
  if (!options.suffix) {
    return key;
  }

  if (!options.prefix || alwaysPersonTypeSuffix(key)) {
    if (key.includes(': ')) {
      return key.replace(': ', `: ${options.suffix}, `);
    }
    return `${key}: ${options.suffix}`;
  }
  return `${options.prefix} ${key}`;
}

export type EmojiData = {
  key: string;
  emoji: string;
  description: string;
  pt?: string;
  tones?: string[]; // 5 or 25 emoji
  dir?: string;
};

export type EncodedAllEmojiData = Record<string, string | string[]>;
