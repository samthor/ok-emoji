import test from 'node:test';
import * as assert from 'node:assert';
import { type EmojiLine, iterateEmojiTest } from './parser.ts';

const raw = `
# Some comments

# Some other comments


# group: butts

1F600                                                  ; fully-qualified     # 😀 E1.0 grinning face

# subgroup: whatever

1F603                                                  ; fully-qualified     # 😃 grinning face with big eyes
`;

test('iterate', () => {
  const expected: EmojiLine[] = [
    {
      emoji: '😀',
      version: 100,
      description: 'grinning face',
      qualifier: 'fully-qualified',
      group: 'butts',
      subgroup: '',
    },
    {
      emoji: '😃',
      version: 0,
      description: 'grinning face with big eyes',
      qualifier: 'fully-qualified',
      group: 'butts',
      subgroup: 'whatever',
    },
  ];

  const actual = [...iterateEmojiTest(raw)];
  assert.deepStrictEqual(actual, expected);
});
