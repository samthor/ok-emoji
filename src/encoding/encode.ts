import { classifyAllEmoji } from '../classify.ts';
import type { EmojiLine } from '../parser.ts';
import { expandPersonType } from './shared.ts';

export type EncodedKeyType = Record<string, string | string[]>;

export function encodeClassifyOut(raw: EmojiLine[]): {
  byKey: EncodedKeyType;
  order: EmojiLine[];
} {
  const byKey: EncodedKeyType = {};
  const allByName = classifyAllEmoji(raw);
  const outputOrder: string[] = [];

  for (const [name, all] of Object.entries(allByName)) {
    outputOrder.push(...all.map((e) => e.line.emoji));

    if (all.length === 1) {
      const only = all[0];
      const d = only.line.description;

      // simple case: single emoji, name was same
      if (d === name || `~${d}` === name) {
        byKey[name] = all[0].line.emoji;
        continue;
      }
    }

    const dataForKey: string[] = [];

    for (let i = 0; i < all.length; ++i) {
      const curr = all[i];

      const parts = [curr.line.emoji, curr.dp.pt ?? '', curr.dp.dir ?? ''];
      while (parts.at(-1) === '') {
        parts.pop();
      }
      let line = parts.join(',');

      if (curr.dp.tones) {
        if (!/^_+$/.test(curr.dp.tones)) {
          throw new Error(`expected number of underscores`);
        }
        // nb. this only works on maybe past 13.1, where everything has either 5/25 tones
        const nextTones = Math.pow(5, curr.dp.tones.length);
        const tonedEntries = all.slice(i + 1, i + 1 + nextTones);
        const tonedEmoji = tonedEntries.map(({ line: { emoji } }) => emoji);

        i += nextTones;

        line += `|` + tonedEmoji.join(',');
      }

      const guessName = expandPersonType(curr.dp.pt, name) ?? name;
      if (curr.line.description !== guessName) {
        line = `${curr.line.description}#` + line;
      }

      dataForKey.push(line);
    }

    byKey[name] = dataForKey;
  }

  // yield new order (changes because of werid layout)
  const lineByEmoji: Record<string, EmojiLine> = {};
  for (const line of raw) {
    lineByEmoji[line.emoji] = line;
  }

  const order: EmojiLine[] = outputOrder.map((emoji) => lineByEmoji[emoji]);
  return { byKey, order };
}
