
import {split, single, iterate} from './src/encoding.js';
import {supported} from './src/measure.js';
import {normalizeForStorage} from './task/server.js';
import {restoreForClient, supportsTone, genderVariants, applySkinTone} from './task/client.js';
import { deexpando } from './src/expando.js';

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
      '👩🏾‍🍼👵🏻': ['👩‍🍼', '👵'],  // gender not removed for run
      '👩🏾‍🍼': ['🧑‍🍼'],
      '👩‍👩‍👧👩‍👧': ['👩‍👩‍👧', '👩‍👧'],
      '👩‍👧': ['👪'],
      '👨‍❤‍👨': ['\u{1f9d1}\u{200d}\u{2764}\u{fe0f}\u{200d}\u{1f9d1}'],
      '👭': ['\u{1f9d1}\u{200d}\u{1f91d}\u{200d}\u{1f9d1}'],  // expando'ed version
      '👱‍♂️': ['👱'],
    };

    Object.keys(tests).forEach((raw) => {
      const expected = tests[raw];
      assert.deepEqual(normalizeForStorage(raw), expected);
    });
  });
});

suite('expando', () => {
  test('deexpando', () => {
    const deexpandoPrincess = [0x1f469, 0x1f451];
    assert.isTrue(deexpando(deexpandoPrincess));
    assert.deepEqual(deexpandoPrincess, [0x1f478]);
  });
});

suite('client', () => {
  test('restoreForClient', () => {
    assert.deepEqual(restoreForClient('🧑‍👑', 140), null, 'version 14 supports "royalty"');
    assert.deepEqual(restoreForClient('🧑‍👑', 130), ['👸', '🤴'], 'version 13 does not support "royalty"');

    assert.deepEqual(restoreForClient('🧑‍🎄', 130), null, 'version 13 supports this');
    assert.deepEqual(restoreForClient('🧑‍🎄', 120), ['🤶', '🎅'], 'version 12 does not support mx claus');

    assert.deepEqual(restoreForClient('🦷🤍', 130), null, 'version 13');
    assert.deepEqual(restoreForClient('🦷🤍', 121), null, 'version 12.1');
    assert.deepEqual(restoreForClient('🦷🤍', 110), ['🦷'], 'version 11');
    assert.deepEqual(restoreForClient('🦷🤍', 50), [], 'version 5 supports nothing');
    assert.deepEqual(restoreForClient('🦸abc', 50), ['abc'], 'version 5 removes superhero');

    assert.deepEqual(restoreForClient('🧑‍🤝‍🧑', 120), ['👫']);

    assert.deepEqual(restoreForClient('🧑‍🦰', 130), null, 'hair support in 13');
    assert.deepEqual(restoreForClient('🧑‍🦰', 120), ['👩‍🦰', '👨‍🦰'], 'no neuter hair in 12');
    assert.deepEqual(restoreForClient('🧑‍🦰', 50), [], 'no hair in 5');

    assert.deepEqual(restoreForClient('🦸', 0), null, 'zero version should make no changes');
  });

  test('supportsTone', () => {
    assert.strictEqual(supportsTone('🧑‍🤝‍🧑', 121), 2, 'tones 12.1+');
    assert.strictEqual(supportsTone('🧑‍🤝‍🧑', 100), 0, 'no tones before 12.1');
    assert.strictEqual(supportsTone('🧑‍🎄', 0), 1);
  });

  test('genderVariants', () => {
    assert.deepEqual(genderVariants('🧔‍♂️', 131), {
      f: '🧔‍♀️',
      m: '🧔‍♂️',
      n: '🧔',
    });

    assert.deepEqual(genderVariants('🧔‍♂️', 130), {});

    assert.deepEqual(genderVariants('👦', 130), {
      f: '👧',
      m: '👦',
      n: '🧒',
    });

    assert.deepEqual(genderVariants('👸👨‍⚕️', 120), {
      f: '👸👩‍⚕️',
      m: '🤴👨‍⚕️',
    });

    assert.deepEqual(genderVariants('👸👨‍⚕️', 130), {
      f: '👸👩‍⚕️',
      m: '🤴👨‍⚕️',
      n: '👸🧑‍⚕️',  // princess remains same, no normalized version
    });

    assert.deepEqual(genderVariants('👸', 140), {
      f: '👸',
      m: '🤴',
      n: '🧑‍👑',  // normalized version is coming soon
    });

    assert.deepEqual(genderVariants('👩🏾‍🍼', 130), {
      f: '👩🏾‍🍼',
      m: '👨🏾‍🍼',
      n: '🧑🏾‍🍼',
    });

    assert.deepEqual(genderVariants('👩🏾‍🍼', 120), {});  // no variants in 120, unsupported

    assert.deepEqual(genderVariants('💇🏻‍♂️', 130), {
      f: '💇🏻‍♀️',
      m: '💇🏻‍♂️',
      n: '💇🏻',
    });

    assert.deepEqual(genderVariants('🧑‍🤝‍🧑', 131), {
      n: '🧑‍🤝‍🧑',
      f: '👭',
      c: '👫',
      m: '👬',
    });

    assert.deepEqual(genderVariants('🐇💏'), {
      n: '🐇💏',
      f: '🐇👩‍❤️‍💋‍👩',
      c: '🐇👩‍❤️‍💋‍👨',
      m: '🐇👨‍❤️‍💋‍👨',
    });
  });

  test('applySkinTone', () => {
    assert.equal(applySkinTone('👩🏾‍🍼', 0, 0), '👩‍🍼');
    assert.equal(applySkinTone('🦷👩‍🍼👩‍🍼', 0, 0x1f3fe), '🦷👩🏾‍🍼👩🏾‍🍼');
    assert.equal(applySkinTone('🦷👩‍🍼👩‍🍼', 0, 0x1f3fe), '🦷👩🏾‍🍼👩🏾‍🍼');
    assert.equal(applySkinTone('🧑‍🤝‍🧑', 0, 0x1f3fe), '🧑🏾‍🤝‍🧑🏾');
    assert.equal(applySkinTone('🧑‍🤝‍🧑', 0, 0x1f3ff, 0x1f3fb), '🧑🏿‍🤝‍🧑🏻');
    assert.equal(applySkinTone('🧑🏾‍🤝‍🧑🏾', 120, 0x1f3ff, 0x1f3fb), '🧑🏾‍🤝‍🧑🏾', 'assert no change');
  });
});

(measureSupport ? suite : suite.skip)('measure', () => {
  test('basic \u{1f602} render', () => {
    assert.isTrue(supported('\u{1f602}'), 'face with tears of joy (E0.6) not supported');
    assert.isFalse(supported('\u{ffffd}'));
  });
});
