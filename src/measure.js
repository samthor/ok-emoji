
import {isToneModifier} from './helper.js';
import {jsdecode} from './string.js';

/**
 * @param {number} width
 * @param {number} height
 * @return {!HTMLCanvasElement|!OffscreenCanvas}
 */
function buildCanvas(width, height) {
  if (typeof HTMLCanvasElement !== 'undefined') {
    const c = document.createElement('canvas');
    c.width = width;
    c.height = height;
    return c;
  } else if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height);
  }
  throw new TypeError(`no canvas available`);
}

const w = 2;
const h = 2;
const fontFamily = `'Lato', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Apple Color Emoji', 'Helvetica Neue', 'Helvetica', sans-serif`;
const fontSize = h + 0.5;

// The exact position/size of the font used isn't perfect, but it doesn't matter: the goal is to
// compare specifically to a poor glyph.

const canvas = buildCanvas(w, h);
const context = canvas.getContext('2d');
context.fillStyle = 'rgb(64, 96, 32)';
context.textBaseline = 'top';

const render = (s) => {
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillText(s, -1, -1);
};

/**
 * Finds a font size for this device which maximizes our chance of detecting
 * valid or invalid emoji. We use a 2x2 grid, so look for 75% worth of data.
 *
 * @return {!Uint32Array<number>} always four 32-bit ints
 */
function prepareEmpty() {
  let offset = 0.0;
  let moveOffsetBy = 0.1;
  let found = null;
  let count = 0;

  for (let j = 0; j < 10; ++j) {
    context.font = `italic ${fontSize + offset}px ${fontFamily}`;
    render('\uffff');  // always unsupported

    const emptyData = context.getImageData(0, 0, w, h);
    const out = new Uint32Array(emptyData.data.buffer);

    // Count the number of pixels that have any data. F
    const cand = out.reduce((prev, ours) => ours !== 0 ? prev + 1 : prev, 0);
    if (cand > count) {
      count = cand;
      found = out;
      if (cand >= 3) {
        break;
      }
    }

    offset = -offset;
    offset += Math.sign(offset + (moveOffsetBy / 2)) * moveOffsetBy;
    moveOffsetBy *= 1.2;
  }

  if (count === 0) {
    console.warn('could not initialize ok-emoji, zero bytes found');
    return [0, 0, 0, 0];
  }

  console.info('found at', count, found, context.font);
  return found;
}

// TODO(samthor): For testing
if (typeof document !== 'undefined') {
  canvas.style.width = `${canvas.width * 10}px`;
  canvas.style.height = `${canvas.height * 10}px`;
  canvas.style.imageRendering = 'pixelated';
  document.body.append(canvas);
}

// TODO(samthor): This is fixed for 16 bytes.
const [e0, e1, e2, e3] = prepareEmpty();

/**
 * Is a ZWJ-joined emoji supported? This can use the measureText fast-path.
 *
 * @param {string} s to check
 * @param {number} zwjIndex index of first ZWJ
 * @return {boolean}
 */
function joinedSupported(s, zwjIndex) {
  const whole = context.measureText(s);

  // This probably won't work most of the time as the left side is arguably 
  // This has limited utility but probably is faster in some obscure cases, e.g.:
  //   - on a variable width system, e.g. a family member is wider than the family itself
  //   - the left part is itself unsupported (TODO: this seems like a bad case)
  const left = context.measureText(s.substr(0, zwjIndex));
  if (left.width > whole.width) {
    return true;
  }

  const right = context.measureText(s.substr(zwjIndex + 1));
  return left.width + right.width > whole.width;
}

/**
 * Is an emoji with skin tone supported? This can use a measureText fast-path.
 *
 * @param {string} s to check, assumed contains tones
 * @return {boolean}
 */
function toneSupported(s) {
  const points = jsdecode(s);
  const clean = points.filter((point) => !isToneModifier(point));
  const compare = String.fromCodePoint.apply(null, clean);

  const originalMetric = context.measureText(s);
  const cleanMetric = context.measureText(compare);
  return originalMetric.width === cleanMetric.width;
}

/**
 * Checks a single emoji for validity. Has unknown results for sequences of more than one.
 *
 * @param {string} s to check
 * @return {boolean}
 */
export function supported(s) {
  let i = 0;
  const len = s.length;
  let hasTone = false;

  while (i < len) {
    const r = s.codePointAt(i);

    if (r === 0x200d) {
      // just work out if the thing on the left is shorter than the whole
      if (!joinedSupported(s, i)) {
        return false;
      } else if (!hasTone) {
        return true;
      }
      // measure the thing on the left as a toned thing
      s = s.substr(0, i);
      break;
    }
    hasTone = hasTone || isToneModifier(r);

    if (r > 0xffff) {
      i += 2;  // surrogate pair
    } else {
      ++i;
    }
  }

  if (hasTone) {
    return toneSupported(s);
  }

  // TODO(samthor): Technically, Firefox renders all missing glyphs with their code embedded within
  // them. But there's also weird rules around pixelation (at least on Mac). So for now, comparing
  // to a simple one at 2x2 size works fine.

  render(s);

  const {data} = context.getImageData(0, 0, w, h);
  const u32 = new Uint32Array(data.buffer);
  const support = u32[0] !== e0 || u32[1] !== e1 || u32[2] !== e2 || u32[3] !== e3;

  return support;
};
