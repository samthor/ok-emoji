import type { EncodedKeyType } from './encode.ts';
import { expandPersonType } from './shared.ts';

export type DecodedType = {
  emoji: string;
  name: string;
  pt?: string;
  tones?: string[]; // 5 or 25 emoji
  dir?: string;
};

const decodeRe = /^(?:([^#]*)#|)(.*?)(?:|\|(.*))$/;

export function decodeClassifyOut(enc: EncodedKeyType) {
  const out: DecodedType[] = [];

  const seen = new Set<string>();

  for (const [key, data] of Object.entries(enc)) {
    if (typeof data === 'string') {
      out.push({ emoji: data, name: key });
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
      let name = m[1] || expandPersonType(pt, key) || key;

      if (name.startsWith('~')) {
        name = name.substring(1);
      }

      if (seen.has(emoji) || seen.has(name)) {
        throw new Error(`already seen ${emoji}/${name}`);
      }
      seen.add(emoji).add(name);

      const dt: DecodedType = {
        emoji,
        name,
      };

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
