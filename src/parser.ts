import { codepointsFor } from './forms.ts';
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
   * Group name as source data.
   */
  group: string;

  /**
   * Subgroup name as source data.
   */
  subgroup: string;
};

const commentRe = /^(\S+)\s+(?:(E[\d\.]+)\s+|)(.*)$/;

/**
 * Low-level iterator through data formatted like "emoji-test.txt". Yields lines of data.
 *
 * Skips data which is not "fully-qualified" or "component".
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

    const qualifier = qualifiedRaw.trim();
    if (!['fully-qualified', 'component'].includes(qualifier)) {
      continue;
    }

    const m = commentRe.exec(commentRaw.trim());
    if (!m) {
      throw new Error(`bad comment: ${commentRe}`);
    }

    const emoji = m[1];
    const versionStr = m[2];
    const description = m[3];
    const version = versionStr ? Math.round(100 * parseFloat(versionStr.substring(1))) : 0;

    const codepoints = codepointRaw
      .trim()
      .split(/\s+/g)
      .map((s) => parseInt(s, 16));
    const expectedEmoji = String.fromCodePoint(...codepoints);

    if (emoji !== expectedEmoji) {
      throw new Error(
        `badly formed test data: emoji=${codepointsFor(emoji)} expected=${codepointsFor(
          expectedEmoji,
        )} raw=${codepointRaw}`,
      );
    }

    yield {
      emoji,
      version,
      description,
      qualifier: qualifier as EmojiLine['qualifier'],
      group,
      subgroup,
    };
  }
}
