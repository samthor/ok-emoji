import type { ClassifyOut } from '../classify.ts';
import { type EmojiData, type EncodedAllEmojiData, expandPersonType } from './shared.ts';

export function encodeAllEmojiData(all: EmojiData[]) {
  const out: EncodedAllEmojiData = {};

  const byKey: Record<string, EmojiData[]> = {};

  for (const each of all) {
    byKey[each.key] ??= [];
    byKey[each.key].push(each);
  }

  for (const [key, allForKey] of Object.entries(byKey)) {
    if (allForKey.length === 1) {
      const only = allForKey[0];
      const d = only.description;

      // simple case: single emoji, name was same
      if ((d === key || `~${d}` === key) && !only.dir && !only.pt && !only.tones) {
        out[key] = only.emoji;
        continue;
      }
    }

    out[key] = allForKey.map((each) => {
      const parts = [each.emoji, each.pt ?? '', each.dir ?? ''];
      while (parts.at(-1) === '') {
        parts.pop();
      }
      let line = parts.join(',');

      if (each.tones) {
        line += '|' + each.tones.join(',');
      }

      const guessName = expandPersonType(each.pt, key) ?? key;
      if (each.description !== guessName) {
        line = `${each.description}#` + line;
      }

      return line;
    });
  }

  return out;
}

export function buildAllEmojiData(c: ClassifyOut): EmojiData[] {
  const out: EmojiData[] = [];

  for (const [key, all] of Object.entries(c)) {
    for (let i = 0; i < all.length; ++i) {
      const curr = all[i];
      let tones: string[] | undefined;

      if (curr.dp.tones) {
        if (!/^_+$/.test(curr.dp.tones)) {
          throw new Error(`expected number of underscores`);
        }
        // nb. this only works on maybe past 13.1, where everything has either 5/25 tones
        const nextTones = Math.pow(5, curr.dp.tones.length);
        const tonedEntries = all.slice(i + 1, i + 1 + nextTones);
        tones = tonedEntries.map(({ line: { emoji } }) => emoji);
        i += nextTones;
      }

      const dt: EmojiData = { emoji: curr.line.emoji, key, description: curr.line.description };
      if (curr.dp.pt) {
        dt.pt = curr.dp.pt;
      }
      if (tones) {
        dt.tones = tones;
      }
      if (curr.dp.dir) {
        dt.dir = curr.dp.dir;
      }
      out.push(dt);
    }
  }

  return out;
}
