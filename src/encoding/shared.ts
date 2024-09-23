/**
 * Expands a pt string back to a friendly name.
 */
export function expandPersonType(pt: string | undefined, name: string) {
  if (pt === undefined) {
    return name;
  }

  switch (pt) {
    case 'w':
      return `woman ${name}`;
    case 'm':
      return `man ${name}`;
    case 'p':
      return `person ${name}`;
    case 'pp':
      return `people ${name}`;
    case 'ww':
      return `women ${name}`;
    case 'wm':
      return `woman and man ${name}`;
    case 'mw':
      return `man and woman ${name}`;
    case 'mm':
      return `men ${name}`;
  }
  return undefined;
}

export const personTypeAllData: Record<string, string> = {
  '?': 'default',
  p: 'adult', // not used normally, just for family render
  w: 'woman',
  m: 'man',
  c: 'child',
  g: 'girl',
  b: 'boy',
};

export function personTypeAll(pt: string | undefined, key?: string) {
  if (!pt) {
    return '';
  }

  if (['family', 'couple with heart', 'kiss'].includes(key!)) {
    // splay out normally
    return [...pt]
      .map((each) => personTypeAllData[each] ?? '')
      .filter((x) => x)
      .join(', ');
  }

  const out = expandPersonType(pt, '')?.trim();
  if (!out) {
    throw new Error(`could not expand: ${pt}`);
  }
  return out;
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
