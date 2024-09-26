import { expandPersonType, type EmojiData, type EncodedAllEmojiData } from './shared.ts';

const decodeRe = /^(?:([^#]*)#|)(.*?)(?:|\|(.*))$/;

export function decodeAllEmojiData(enc: EncodedAllEmojiData): EmojiData[] {
  const out: EmojiData[] = [];

  const seen = new Set<string>();

  for (const [key, data] of Object.entries(enc)) {
    if (typeof data === 'string') {
      out.push({ emoji: data, key, description: key });
      continue;
    }

    for (const line of data) {
      const m = decodeRe.exec(line);
      if (!m) {
        throw new Error(`bad dec line: ${line}`);
      }

      let tones: string[] | undefined;
      if (m[3]) {
        tones = m[3].split(',');
        if (!(tones.length === 5 || tones.length === 25)) {
          throw new Error(`bad tones length: ${tones.length}`);
        }
      }

      const [emoji, pt, dir] = m[2].split(',');
      let description = m[1] || expandPersonType(pt, key) || key;

      if (description.startsWith('~')) {
        description = description.substring(1);
      }

      if (seen.has(emoji) || seen.has(description)) {
        throw new Error(`already seen ${emoji}/${description}`);
      }
      seen.add(emoji).add(description);

      const dt: EmojiData = { emoji, key, description };
      if (pt) {
        dt.pt = pt;
      }
      if (tones) {
        dt.tones = tones;
      }
      if (dir) {
        dt.dir = dir;
      }
      out.push(dt);
    }
  }

  return out;
}
