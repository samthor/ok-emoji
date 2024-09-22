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

export type EmojiData = {
  key: string;
  emoji: string;
  description: string;
  pt?: string;
  tones?: string[]; // 5 or 25 emoji
  dir?: string;
};

export type EncodedAllEmojiData = Record<string, string | string[]>;
