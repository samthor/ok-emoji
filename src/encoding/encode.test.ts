import test from 'node:test';
import assert from 'node:assert';
import { encodeAllEmojiData } from './encode.ts';
import type { EmojiData } from './shared.ts';

test('encodeAllEmojiData', () => {
  const input: EmojiData[] = [
    { key: 'smile', emoji: '😀', description: 'smile' },
    { key: 'kiss', emoji: '👩‍❤️‍💋‍👨', description: 'kiss: woman, man', pt: 'wm' },
    { key: 'singer', emoji: '👨‍🎤', description: 'man singer', pt: 'm' },
    { key: 'point', emoji: '👉', description: 'point', tones: ['👉🏻', '👉🏼', '👉🏽', '👉🏾', '👉🏿'] },
    { key: 'custom', emoji: '🧌', description: 'troll', dir: 'right' }
  ];

  const encoded = encodeAllEmojiData(input);
  assert.deepStrictEqual(encoded, {
    smile: '😀',
    kiss: ['👩‍❤️‍💋‍👨,wm'], // kiss: woman, man is the exact guess
    singer: ['👨‍🎤,m'],
    point: ['👉|👉🏻,👉🏼,👉🏽,👉🏾,👉🏿'], // point === guess, pt='', dir='', then tones
    custom: ['troll#🧌,,right'] // desc != guess
  });
});
