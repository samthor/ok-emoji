import test from 'node:test';
import assert from 'node:assert';
import { decodeAllEmojiData } from './decode.ts';
import type { EncodedAllEmojiData } from './shared.ts';

test('decodeAllEmojiData', () => {
  const encoded: EncodedAllEmojiData = {
    smile: '😀',
    kiss: ['👩‍❤️‍💋‍👨,wm'],
    singer: ['👨‍🎤,m'],
    point: ['👉|👉🏻,👉🏼,👉🏽,👉🏾,👉🏿'],
    custom: ['troll#🧌,,right']
  };

  const decoded = decodeAllEmojiData(encoded);
  assert.strictEqual(decoded.length, 5);
  
  assert.deepStrictEqual(decoded[0], { key: 'smile', emoji: '😀', description: 'smile' });
  assert.deepStrictEqual(decoded[1], { key: 'kiss', emoji: '👩‍❤️‍💋‍👨', description: 'kiss: woman, man', pt: 'wm' });
  assert.deepStrictEqual(decoded[2], { key: 'singer', emoji: '👨‍🎤', description: 'man singer', pt: 'm' });
  assert.deepStrictEqual(decoded[3], { key: 'point', emoji: '👉', description: 'point', tones: ['👉🏻', '👉🏼', '👉🏽', '👉🏾', '👉🏿'] });
  assert.deepStrictEqual(decoded[4], { key: 'custom', emoji: '🧌', description: 'troll', dir: 'right' });
});
