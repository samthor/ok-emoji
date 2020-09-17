
import {split, single, iterate} from './src/encoding.js';
import {supported} from './src/measure.js';
// import {singleBase, genderVariants, supportsDoubleTone, supportsTone} from './src/variants.js';
import {normalize, denormalizeForSupport} from './src/valid.js';
import {normalizeForStorage} from './task/server.js';
import {restoreForClient, supportsTone, genderVariants, applySkinTone} from './task/client.js';

const {suite, test, assert} = self;

// TODO(samthor): We don't support being run on the command-line. Update headless-test.

// import mocha from 'mocha';
// const {suite, test} = mocha;

// import chai from 'chai';
// const {assert} = chai;


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

  test('tone vs VS16', () => {
    assert.equal(single([0x261d]), '\u{261d}\u{fe0f}', 'implicit VS16');
    assert.equal(single([0x261d, 0x1f3ff]), '\u{261d}\u{1f3ff}', 'tone replaces VS16');
    assert.equal(single([0x1f3cc, 0x2640]), '\u{1f3cc}\u{fe0f}\u{200d}\u{2640}\u{fe0f}', 'needs two VS16s');
  });

  test('tagged reassemble', () => {
    assert.equal(single([0x1f3f4, 0xe0067, 0xe0062, 0xe0073, 0xe0063, 0xe0074]), '🏴󠁧󠁢󠁳󠁣󠁴󠁿');
  });
});

// suite('variations', () => {
//   test('base', () => {
//     assert.deepEqual(singleBase([0x1f385, 0x1f3fd]), [0x1f9d1, 0x1f384], 'santa => mx claus');
//     assert.deepEqual(singleBase([0x1f994]), [0x1f994], 'hedgehog => hedgehog');
//     assert.deepEqual(singleBase([0x1f466, 0x1f3fd]), [0x1f9d2], 'boy => child');

//     const handsBase = [0x1f9d1, 0x1f91d, 0x1f9d1];
//     assert.deepEqual(singleBase([0x1f46d, 0x1f3ff]), handsBase, 'women => people holding hands');
//     assert.deepEqual(singleBase([0x1f469, 0x1f91d, 0x1f468]), handsBase, 'invalid expando\'ed holding hands => base');
//     assert.deepEqual(singleBase([0x1f468, 0x1f91d, 0x1f469]), handsBase, 'invalid m/f holding hands => base');
//   });

//   test('variants', () => {
//     const miscFamily = iterate('👨‍👩‍👧‍👧').next().value;
//     const familyVariants = genderVariants(miscFamily);
//     assert.lengthOf(Object.keys(familyVariants), 26, 'family has 25 variants + neutral');

//     // technologist
//     assert.deepEqual(genderVariants([0x1f468, 0x1f3fd, 0x1f4bb]), {
//       'n': [0x1f9d1, 0x1f4bb],
//       'f': [0x1f469, 0x1f4bb],
//       'm': [0x1f468, 0x1f4bb],
//     });

//     assert.isTrue(supportsTone([0x1f468, 0x1f4bb]));
//     assert.isFalse(supportsDoubleTone([0x1f468, 0x1f4bb]));

//     assert.isTrue(supportsTone([0x1f46d]));
//     assert.isTrue(supportsDoubleTone([0x1f46d]));

//     assert.isFalse(supportsTone([0x1f30b, 0x1f4bb]), 'should not support tone just because tone passed');

//     // only f/m
//     assert.deepEqual(genderVariants([0x1f57a]), {
//       'f': [0x1f483],
//       'm': [0x1f57a],
//     });
//   });
// });

suite('normalize', () => {
  test('santa', () => {
    assert.equal(normalize('🎅🏼').s, '🧑‍🎄', 'santa should revert to mx claus');
    assert.equal(denormalizeForSupport('🧑‍🎄', 130), '🧑‍🎄', 'version 13 supports this');
    assert.notEqual(denormalizeForSupport('🧑‍🎄', 120), '🧑‍🎄', 'version 12 does not support mx claus');
  });

  test('removed', () => {
    assert.equal(denormalizeForSupport('🪃', 130), '🪃', 'unicode 13 should retain boomerang');
    assert.equal(denormalizeForSupport('🪃', 120), '', 'unicode 12 should remove boomerang');
  });
});

suite('server', () => {
  test('normalizeForStorage', () => {
    const tests = {
      '🐻‍❄️': ['\u{1f43b}\u{200d}\u{2744}\u{fe0f}'],
      '🐻‍❄️🐻‍❄️': ['\u{1f43b}\u{200d}\u{2744}\u{fe0f}', '\u{1f43b}\u{200d}\u{2744}\u{fe0f}'],
      '⚧️': ['\u{26a7}\u{fe0f}'],
      '🏳️‍⚧️🏳️‍🌈': ['\u{1f3f3}\u{fe0f}\u{200d}\u{26a7}\u{fe0f}', '\u{1f3f3}\u{fe0f}\u{200d}\u{1f308}'],
      '\u{af3f9}': [],  // unknown/invalid
      '🇨🇬abc🇨🇬': ['🇨🇬', '🇨🇬'],
      '\u{1f6bd}\u{200d}\u{1f6bd}': [],  // toilet cannot combine with toilet
      '👸🏽': ['\u{1f9d1}\u{200d}\u{1f451}'],
      '👩🏾‍🤝‍👨🏻': ['\u{1f9d1}\u{200d}\u{1f91d}\u{200d}\u{1f9d1}'],
      'a🏴󠁧󠁢󠁳󠁣󠁴󠁿q': ['🏴󠁧󠁢󠁳󠁣󠁴󠁿'],
      '👩🏾‍🍼👵🏻': ['🧑‍🍼', '🧓'],
      '👩‍👩‍👧👩‍👧': ['👪', '👪'],
      '👨‍❤‍👨': ['\u{1f9d1}\u{200d}\u{2764}\u{fe0f}\u{200d}\u{1f9d1}'],
    };

    Object.keys(tests).forEach((raw) => {
      const expected = tests[raw];
      assert.deepEqual(normalizeForStorage(raw), expected);
    });
  });
});

suite('client', () => {
  test('restoreForClient', () => {
    assert.equal(restoreForClient('🧑‍🎄', 130), '🧑‍🎄', 'version 13 supports this');
    assert.oneOf(restoreForClient('🧑‍🎄', 120), ['🎅', '🤶'], 'version 12 does not support mx claus');

    assert.equal(restoreForClient('🦷🤍', 130), '🦷🤍', 'version 13');
    assert.equal(restoreForClient('🦷🤍', 121), '🦷🤍', 'version 12.1');
    assert.equal(restoreForClient('🦷🤍', 110), '🦷', 'version 11');
    assert.equal(restoreForClient('🦷🤍', 50), '', 'version 5 supports nothing');
    assert.equal(restoreForClient('🦸abc', 50), 'abc', 'version 5 removes superhero');

    assert.equal(restoreForClient('🧑‍🦰', 130), '🧑‍🦰', 'hair support in 13');
    assert.oneOf(restoreForClient('🧑‍🦰', 120), ['👨‍🦰', '👩‍🦰'], 'no neuter hair in 12');
    assert.equal(restoreForClient('🧑‍🦰', 50), '', 'no hair in 5');

    assert.equal(restoreForClient('🦸', 0), '🦸', 'zero version should make no changes');
  });

  test('supportsTone', () => {
    assert.equal(supportsTone('🧑‍🎄'), 1);
  });

  test('genderVariants', () => {
    assert.deepEqual(genderVariants('👩🏾‍🍼', 130), {
      f: '👩🏾‍🍼',
      m: '👨🏾‍🍼',
      n: '🧑🏾‍🍼',
    });
  });

  test('applySkinTone', () => {
    assert.equal(applySkinTone('👩🏾‍🍼', 0), '👩‍🍼');
    assert.equal(applySkinTone('🦷👩‍🍼👩‍🍼', 0x1f3fe), '🦷👩🏾‍🍼👩🏾‍🍼');
  });
});

(measureSupport ? suite : suite.skip)('measure', () => {
  test('basic \u{1f602} render', () => {
    assert.isTrue(supported('\u{1f602}'), 'face with tears of joy (E0.6) not supported');
    assert.isFalse(supported('\u{ffffd}'));
  });
});
