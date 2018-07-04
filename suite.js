
import {emojiPointCount, iterateEmoji} from './src/emoji.js';
import {countRenderPoints, isSingleValidEmoji, isExpectedLength} from './src/measurer.js';

suite('emoji', () => {
  test('point count', () => {
    // single emoji once and twice
    assert.equal(emojiPointCount('\u{1f602}'), 1);
    assert.equal(emojiPointCount('\u{1f602}\u{1f602}'), 2);

    // keycap
    assert.equal(emojiPointCount('\u{0023}\u{fe0f}\u{20e3}'), 1);
    assert.equal(emojiPointCount('\u{0023}\u{fe0f}\u{20e3}\u{1f602}'), 2);

    // complex emoji
    assert.equal(emojiPointCount('\u{1f467}\u{1f3fb}'), 1);
  });

  test('iterate', () => {
    const all = (x) => [...iterateEmoji(x)];

    assert.deepEqual(all('\u{1f602}'), [[0x1f602]]);
    assert.deepEqual(all('\u{0023}\u{fe0f}\u{20e3}\u{1f602}'),
        [[0x0023, 0xfe0f, 0x20e3], [0x1f602]]);
    assert.deepEqual(all('\u{1f1e6}\u{1f1e6}\u{1f1e6}'), [[0x1f1e6, 0x1f1e6, 0x1f1e6]]);
  });
});

suite('measurer', () => {
  test('render points', () => {
    assert.equal(countRenderPoints('abc'), 3);
    assert.equal(countRenderPoints('abc def'), 7);
    assert.equal(countRenderPoints('\u{1f602} abc def'), 9);
  });

  test('single valid', () => {
    assert.isTrue(isSingleValidEmoji('\u{1f602}'), 'single emoji is single point');
    assert.isFalse(isSingleValidEmoji('\u{1f602}\u{1f602}'), 'double emoji should be single');
  });
  
  test('single valid shouldn\'t work on chars', () => {
    assert.isFalse(isSingleValidEmoji('a'), 'single char should not be emoji');
  });
});
