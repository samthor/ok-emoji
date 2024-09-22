import { splitFixed } from './string.ts';

export type EmojiLine = {
  /**
   * The string emoji with `0xfe0f` as required. Can split for codepoints.
   */
  emoji: string;

  /**
   * The qualifier of this emoji.
   */
  qualifier: 'fully-qualified' | 'component';

  /**
   * Version in integer. 0.6 is 60, 16.0 is 1600.
   */
  version: number;

  /**
   * Description. Can be used to create dashCase name.
   */
  description: string;

  /**
   * Group name.
   */
  group: string;

  /**
   * Subgroup name.
   */
  subgroup: string;
};

/**
 * Iterates through data formatted like "emoji-test.txt". Yields lines of data.
 */
export function* iterateEmojiTest(raw: string): Generator<EmojiLine, void, void> {
  const lines = raw.split('\n');

  let group: string = '';
  let subgroup: string = '';

  for (const line of lines) {
    if (!/^[A-Z0-9]/.test(line)) {
      if (line.startsWith('# group: ')) {
        group = line.substring('# group: '.length).trim();
        subgroup = ''; // reset subgroup
      } else if (line.startsWith('# subgroup: ')) {
        subgroup = line.substring('# subgroup: '.length).trim();
      }
      continue;
    }

    const [codepointRaw, rest] = splitFixed(line, ';', 2);
    const [qualifiedRaw, commentRaw] = splitFixed(rest, '#', 2);

    const qualified = qualifiedRaw.trim();
    if (!['fully-qualified', 'component'].includes(qualified)) {
      continue;
    }
    const qualifier: EmojiLine['qualifier'] =
      qualified === 'fully-qualified' ? 'fully-qualified' : 'component';

    const [_, emoji, versionStr] = commentRaw.split(' ', 3);

    const description = commentRaw.substring(emoji.length + versionStr.length + 3);
    const version = Math.round(100 * parseFloat(versionStr.substring(1)));

    yield {
      emoji,
      version,
      description,
      qualifier,
      group,
      subgroup,
    };
  }
}
