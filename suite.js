
import {split} from './src/encoding.js';

suite('emoji', () => {
  // test('point count', () => {
  //   // single emoji once and twice
  //   assert.equal(emojiPointCount('\u{1f602}'), 1);
  //   assert.equal(emojiPointCount('\u{1f602}\u{1f602}'), 2);

  //   // keycap
  //   assert.equal(emojiPointCount('\u{0023}\u{fe0f}\u{20e3}'), 1);
  //   assert.equal(emojiPointCount('\u{0023}\u{fe0f}\u{20e3}\u{1f602}'), 2);

  //   // complex emoji
  //   assert.equal(emojiPointCount('\u{1f467}\u{1f3fb}'), 1);
  // });

  test('iterate', () => {
    assert.deepEqual(split('\u{1f602}'), [[0x1f602]]);
    assert.deepEqual(split('\u{0023}\u{fe0f}\u{20e3}\u{1f602}'), [[0x0023, 0x20e3], [0x1f602]]);
    assert.deepEqual(split('\u{1f1e6}\u{1f1e6}\u{1f1e6}'), [[0x1f1e6], [0x1f1e6], [0x1f1e6]]);
    assert.deepEqual(
      split('\u{1f1e6}\u{1f1e6}\u{1f1fa}'),
      [[0x1f1e6], [0x1f1e6, 0x1f1fa]],
      'expected A,AU (valid 2nd flag)',
    );
  });

  // test('stringify', () => {
  //   const d = '\u{1f575}\u{fe0f}\u{200d}\u{2642}\u{fe0f}';
  //   assert.equal(stringify(d), '1f575_200d_2642');
  //   assert.equal(stringify(d, {pad: 5}), '1f575_0200d_02642');
  //   assert.equal(stringify(d, {pad: 6, sep: '-', lower: false}), '01F575-00200D-002642');
  //   assert.equal(stringify(d, {unqualify: false}), '1f575_fe0f_200d_2642_fe0f');
  //   assert.equal(stringify('\u{fe0f}'), '');
  // });
});

// suite('measurer', () => {
//   test('render points', () => {
//     assert.equal(countRenderPoints('abc'), 3);
//     assert.equal(countRenderPoints('abc def'), 7);
//     assert.equal(countRenderPoints('\u{1f602} abc def'), 9);
//   });

//   test('single valid', () => {
//     assert.isTrue(isSingleValidEmoji('\u{1f602}'), 'single emoji is single point');
//     assert.isFalse(isSingleValidEmoji('\u{1f602}\u{1f602}'), 'double emoji should be single');
//   });
  
//   test('single valid shouldn\'t work on chars', () => {
//     assert.isFalse(isSingleValidEmoji('a'), 'single char should not be emoji');
//   });

//   test('expected length', () => {
//     assert.isTrue(isExpectedLength('\u{1f602}\u{1f602}'), 'double face should be expected');
//     assert.isTrue(isExpectedLength('\u{1f468}\u{200d}\u{1f469}\u{200d}\u{1f466}'), 'family should be expected');
//     assert.isFalse(isExpectedLength('x\u{1f468}\u{200d}\u{1f469}\u{200d}\u{1f466}'), 'ascii should fail');
//   });

//   test('flags', () => {
//     assert.isTrue(isExpectedLength('\u{1f1e6}\u{fe0f}\u{1f1e6}\u{fe0f}\u{1f1e6}\u{fe0f}'), 'three regional letters with VS16 valid');
//     assert.isFalse(isExpectedLength('\u{1f1e6}\u{1f1e6}\u{1f1e6}'), 'three regional letters not valid');
//   });
// });
