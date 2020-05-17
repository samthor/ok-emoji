
import {split, single, iterate} from './src/encoding.js';
import {supported} from './src/measure.js';
import {singleBase, genderVariants, supportsDoubleTone, supportsTone} from './src/variants.js';

const measureSupport =
    (typeof HTMLCanvasElement !== 'undefined' || typeof OffscreenCanvas !== 'undefined');

suite('encoding', () => {
  test('keycap iterate', () => {
    assert.deepEqual(split('\u{1f602}'), [[0x1f602]]);
    assert.deepEqual(split('\u{0023}\u{fe0f}\u{20e3}\u{1f602}'), [[0x0023, 0x20e3], [0x1f602]]);
  });

  test('country flag iterate', () => {
    assert.deepEqual(split('\u{1f1e6}\u{1f1fa}'), [[0x1f1e6, 0x1f1fa]], 'normal AU flag');
    assert.deepEqual(split('\u{1f1e6}\u{1f1fa}\u{1f1fa}'), [[0x1f1e6, 0x1f1fa], [0x1f1fa]], 'AU + U');
    assert.deepEqual(split('\u{1f1e6}\u{1f1e6}\u{1f1fa}'), [[0x1f1e6, 0x1f1e6, 0x1f1fa]], 'AAU');
  });

  test('zwj iterate', () => {
    assert.deepEqual(split('👩‍👩‍👦‍👦'), [[0x1f469, 0x1f469, 0x1f466, 0x1f466]]);
    assert.deepEqual(split('👩‍❤‍👨🗣️'), [[0x1f469, 0x2764, 0x1f468], [0x1f5e3]]);
  });

  test('tagged iterate', () => {
    assert.deepEqual(split('🏴󠁧󠁢󠁳󠁣󠁴󠁿🈳'), [[0x1f3f4, 0xe0067, 0xe0062, 0xe0073, 0xe0063, 0xe0074], [0x1f233]]);
  });

  test('join', () => {
    assert.equal(single([0x1f469, 0x2764, 0x1f468]), '👩‍❤️‍👨', 'zwj should auto-qualify');
  });
});

suite('variations', () => {
  test('base', () => {
    assert.deepEqual(singleBase([0x1f385, 0x1f3fd]), [0x1f9d1, 0x1f384], 'santa => mx claus');
    assert.deepEqual(singleBase([0x1f994]), [0x1f994], 'hedgehog => hedgehog');
    assert.deepEqual(singleBase([0x1f466, 0x1f3fd]), [0x1f9d2], 'boy => child');

    const handsBase = [0x1f9d1, 0x1f91d, 0x1f9d1];
    assert.deepEqual(singleBase([0x1f46d, 0x1f3ff]), handsBase, 'women => people holding hands');
    assert.deepEqual(singleBase([0x1f469, 0x1f91d, 0x1f468]), handsBase, 'invalid expando\'ed holding hands => base');
    assert.deepEqual(singleBase([0x1f468, 0x1f91d, 0x1f469]), handsBase, 'invalid m/f holding hands => base');
  });

  test('variants', () => {
    const miscFamily = iterate('👨‍👩‍👧‍👧').next().value;
    const familyVariants = genderVariants(miscFamily);
    assert.lengthOf(Object.keys(familyVariants), 26, 'family has 25 variants + neutral');

    // technologist
    assert.deepEqual(genderVariants([0x1f468, 0x1f3fd, 0x1f4bb]), {
      'n': [0x1f9d1, 0x1f4bb],
      'f': [0x1f469, 0x1f4bb],
      'm': [0x1f468, 0x1f4bb],
    });

    assert.isTrue(supportsTone([0x1f468, 0x1f4bb]));
    assert.isFalse(supportsDoubleTone([0x1f468, 0x1f4bb]));

    assert.isTrue(supportsTone([0x1f46d]));
    assert.isTrue(supportsDoubleTone([0x1f46d]));

    assert.isFalse(supportsTone([0x1f30b, 0x1f4bb]), 'should not support tone just because tone passed');
  });
});

(measureSupport ? suite : suite.skip)('measure', () => {
  test('basic \u{1f602} render', () => {
    assert.isTrue(supported('\u{1f602}'), 'face with tears of joy (E0.6) not supported');
    assert.isFalse(supported('\u{ffffd}'));
  });
});
