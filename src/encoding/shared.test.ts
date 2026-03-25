import test from 'node:test';
import assert from 'node:assert';
import { expandPersonTypeOptions, expandPersonType } from './shared.ts';

test('expandPersonTypeOptions', () => {
  assert.deepStrictEqual(expandPersonTypeOptions(undefined), {});
  assert.deepStrictEqual(expandPersonTypeOptions('w'), { prefix: 'woman', suffix: 'woman' });
  assert.deepStrictEqual(expandPersonTypeOptions('wm'), { prefix: 'woman and man', suffix: 'woman, man' });
  assert.deepStrictEqual(expandPersonTypeOptions('pc'), { prefix: undefined, suffix: 'adult, child' });
  // 'p' is replaced with 'a' (adult) in suffix generation if it only contains 'p' or 'c'
  assert.deepStrictEqual(expandPersonTypeOptions('p'), { prefix: 'person', suffix: 'adult' });
});

test('expandPersonType', () => {
  assert.strictEqual(expandPersonType(undefined, 'base'), 'base');
  assert.strictEqual(expandPersonType('w', 'singer'), 'woman singer');
  assert.strictEqual(expandPersonType('wm', 'couple'), 'woman and man couple');
  // when no prefix, it appends as suffix
  assert.strictEqual(expandPersonType('pc', 'family'), 'family: adult, child');
  
  // always suffix for specific words
  assert.strictEqual(expandPersonType('mw', 'kiss'), 'kiss: man, woman');
  
  // if key has a colon, and no prefix is matched or always suffix
  assert.strictEqual(expandPersonType('pc', 'role: family'), 'role: adult, child, family');
  
  // general prefix addition
  assert.strictEqual(expandPersonType('w', 'role: singer'), 'woman role: singer');
});
