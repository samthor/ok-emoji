const expandAllDescription = ['family', 'couple with heart', 'kiss'];

/**
 * Should the suffix always be used for this raw emoji name. Just hard-coded.
 */
export function alwaysPersonTypeSuffix(description: string) {
  return expandAllDescription.includes(description);
}

/**
 * Expands a 'peron type' string into friendly name options.
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

export const personTypeAllData: Record<string, string> = {
  '?': 'default',
  p: 'person', // replaced to 'adult' when only children exist
  w: 'woman',
  m: 'man',
  c: 'child',
  g: 'girl',
  b: 'boy',

  a: 'adult',

  ww: 'women',
  wm: 'woman and man',
  mw: 'man and woman',
  mm: 'men',
  pp: 'people',
};

export type EmojiData = {
  key: string;
  emoji: string;
  description: string;
  pt?: string;
  tones?: string[]; // 5 or 25 emoji
  dir?: string;
};

export type EncodedAllEmojiData = Record<string, string | string[]>;
