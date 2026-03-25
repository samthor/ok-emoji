import test from 'node:test';
import * as assert from 'node:assert';
import { supportsSingleEmoji } from './support.ts';

const expectedEmojiResult: Record<string, { support: boolean; note?: string }> = {
  '🎎': { support: true },
  '🪏': { support: true, note: 'Test environment now supports Unicode 16.0!' },
  '👋🏼': { support: true, note: 'Complex emoji from Unicode 1.0' },
  '👨🏾‍🦱': { support: true, note: 'Complex emoji from Unicode 11.0' },

  '🈂️': { support: true },
  '♀️': { support: true },
  '⚠️': { support: true },
  '2️⃣': { support: true },

  a: { support: false, note: 'Should not support letter' },
  '1': { support: false, note: 'Should not support number' },
  '10': { support: false, note: 'Should not support number' },
  '*': { support: false, note: 'Should not support star' },

  ℹ: { support: false, note: 'Should not support unqualified' },

  '': { support: false, note: 'Should not support "Shibuya 109"' },

  '🇨🇶': { support: true, note: 'Should support new flag' },
  '🇦🇺': { support: true, note: 'Should support flag' },

  '🇦🇦': { support: false, note: 'Should not support unknown flag (AA)' },
};

test('emoji check', () => {
  for (const [key, { support, note }] of Object.entries(expectedEmojiResult)) {
    const actual = supportsSingleEmoji(key);
    assert.strictEqual(actual, support, note);
  }
});
