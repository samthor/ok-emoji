import test from 'node:test';
import * as assert from 'node:assert';
import { countEmojiRender, qualifyEmojiString } from './forms.ts';

const expectedQualifyResult: Record<string, string> = {
  '🎎': '🎎',
  ℹ: 'ℹ️', // unqualified
  ℹ️: 'ℹ️', // should not change
  '🏴󠁧󠁢󠁥󠁮󠁧󠁿': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', // complex flag
  '🇨🇳': '🇨🇳', // flag
  '👩🏾‍❤‍👩🏿': '👩🏾‍❤️‍👩🏿', // minimally qualified
  '🕴': '🕴️', // unqualified
  '🕴🏾': '🕴🏾', // skin tone
  '5⃣': '5️⃣',
  '5️⃣': '5️⃣',
};

test('qualify check', () => {
  for (const [src, expected] of Object.entries(expectedQualifyResult)) {
    const actual = qualifyEmojiString(src);
    assert.strictEqual(actual, expected);
  }
});

const expectedCounts: Record<string, number> = {
  '🔥🚒🔥🚒': 4,
  '❤️💗': 2,
  '🤯👏🖖🔥🔥🔥': 6,
  '🧑‍🤝‍🧑': 1,
  '5️⃣5️⃣5️⃣': 3,
  '5️⃣🧑‍🤝‍🧑5️⃣5️⃣': 4,
  '🏴󠁧󠁢󠁳󠁣󠁴󠁿🇺🇲': 2,
};

test('count', () => {
  for (const [src, expected] of Object.entries(expectedCounts)) {
    const actual = countEmojiRender(src);
    assert.strictEqual(actual, expected, `mismatch ${src}, actual=${actual} expected=${expected}`);
  }
});
