
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

// The exact position/size of the font used isn't perfect, but it doesn't matter: the goal is to
// compare specifically to a poor glyph.

const canvas = buildCanvas(w, h);
const context = canvas.getContext('2d');
context.font = `italic ${canvas.height + 0.9}px 'Lato', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Apple Color Emoji', 'Helvetica Neue', 'Helvetica', sans-serif`;
context.fillStyle = 'black';
context.textBaseline = 'top';

const render = (s) => {
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillText(s, -1, -1);
};

// TODO(samthor): For testing
if (typeof document !== 'undefined') {
  canvas.style.width = `${canvas.width * 10}px`;
  canvas.style.height = `${canvas.height * 10}px`;
  canvas.style.imageRendering = 'pixelated';
  document.body.append(canvas);
}

// TODO(samthor): This is fixed for 16 bytes.
render('\uffff');  // always unsupported
const emptyData = context.getImageData(0, 0, w, h);
const [e0, e1, e2, e3] = new Uint32Array(emptyData.data.buffer);

/**
 * Is a ZWJ-joined emoji supported?
 *
 * @param {string} s to check
 * @param {number} zwjIndex index of first ZWJ
 * @return {boolean}
 */
function joinedSupported(s, zwjIndex) {

  // console.info('comparing', s, 'to short', s.substr(0, zwjIndex));

  const whole = context.measureText(s);

  const left = context.measureText(s.substr(0, zwjIndex));
  if (left.width > whole.width) {
    return true;
  }

  const right = context.measureText(s.substr(zwjIndex + 1));
  // console.debug('left', s.substr(0, zwjIndex), left.width, 'right', s.substr(zwjIndex + 1), right.width, 'whole', whole.width);
  return left.width + right.width > whole.width;
}

/**
 * Is an emoji with skin tone supported?
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
