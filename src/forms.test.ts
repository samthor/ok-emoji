import test from 'node:test';
import * as assert from 'node:assert';
import { buildQualifyEmoji, buildPlatformMustQualify } from './forms.ts';

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
  const qualifyEmoji = buildQualifyEmoji(buildPlatformMustQualify()!);

  for (const [src, expected] of Object.entries(expectedQualifyResult)) {
    const actual = qualifyEmoji(src);
    assert.strictEqual(actual, expected);
  }
});
