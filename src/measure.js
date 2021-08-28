
import {isToneModifier, isFlagPoint} from './helper.js';
import {jsdecode} from './string.js';
import {internalIterateStep} from './encoding.js';

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

/**
 * @param {boolean} debug
 */
function buildContextSupported(debug = false) {
  const fixedWidthAlways = 2;
  const fixedHeightAlways = 2;
  const fontFamily = `'Segoe UI Emoji', 'Segoe UI Symbol', 'Apple Color Emoji', 'Helvetica Neue', 'Helvetica', monospace, sans-serif`;
  const fontSize = fixedHeightAlways + 0.5;

  // The exact position/size of the font used isn't perfect, but it doesn't matter: the goal is to
  // compare specifically to a poor glyph.

  const canvas = buildCanvas(fixedWidthAlways, fixedHeightAlways);
  const context = /** @type {CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D} */ (canvas.getContext('2d'));
  if (!context) {
    throw new Error(`no context`)
  }

  context.fillStyle = 'rgb(64, 96, 32)';
  context.textBaseline = 'top';

  /** @type {(s: string) => void} */
  const render = (s) => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillText(s, -1, -1);
  };

  /**
   * Finds a font size for this device which maximizes our chance of detecting
   * valid or invalid emoji. We use a 2x2 grid, so look for 75% worth of data.
   *
   * @return {Uint32Array} always four 32-bit ints
   */
  function prepareEmpty() {
    let offset = 0.0;
    let moveOffsetBy = 0.1;
    const found = new Uint32Array(4);
    let count = 0;

    for (let j = 0; j < 10; ++j) {
      context.font = `italic ${fontSize + offset}px ${fontFamily}`;
      render('\uffff');  // always unsupported

      const emptyData = context.getImageData(0, 0, fixedWidthAlways, fixedHeightAlways);
      found.set(new Uint32Array(emptyData.data.buffer), 0);

      // Count the number of pixels that have any data. F
      const cand = found.reduce((prev, ours) => ours !== 0 ? prev + 1 : prev, 0);
      if (cand > count) {
        count = cand;
        if (cand >= 3) {
          break;
        }
      }

      offset = -offset;
      offset += Math.sign(offset + (moveOffsetBy / 2)) * moveOffsetBy;
      moveOffsetBy *= 1.2;
    }

    if (count === 0) {
      throw new TypeError('could not initialize ok-emoji, zero bytes found');
    }

    debug && console.info('found at', count, found, context.font);
    return found;
  }

  // If we're asked to debug, then add the canvas to screen.
  if (debug && canvas instanceof HTMLCanvasElement) {
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
    const {width: whole} = context.measureText(s);

    // This probably won't work most of the time as the left side is arguably 
    // This has limited utility but probably is faster in some obscure cases, e.g.:
    //   - on a variable width system, e.g. a family member is wider than the family itself
    //   - the left part is itself unsupported (TODO: this seems like a bad case)
    const {width: left} = context.measureText(s.substr(0, zwjIndex));
    debug && console.info('got', `'${s}'`, 'width', whole, 'left', left);
    if (left > whole) {
      return true;
    }

    const {width: right} = context.measureText(s.substr(zwjIndex + 1));
    return left + right > whole;
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

    const {width: originalWidth} = context.measureText(s);
    const {width: cleanWidth} = context.measureText(compare);
    return originalWidth === cleanWidth;
  }

  /**
   * @param {string} s to check
   * @return {boolean}
   */
  function oldSingleCheck(s) {
    let i = 0;
    const len = s.length;
    let hasTone = false;

    while (i < len) {
      const r = s.codePointAt(i) ?? 0;

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

    const {data} = context.getImageData(0, 0, fixedWidthAlways, fixedHeightAlways);
    const u32 = new Uint32Array(data.buffer);
    const support = u32[0] !== e0 || u32[1] !== e1 || u32[2] !== e2 || u32[3] !== e3;

    return support;
  }

  /** @type {(s: string) => boolean} */
  return (s) => {
    const length = s.length;
    let i = 0;
    let to = 0;

    while (i < length) {
      i = to;  // reset step

      /** @type {number[]} */
      const points = [];
      to = internalIterateStep(points, s, i);
      if (isFlagPoint(points[0])) {
        // TODO(samthor): assume all country flags work for now
        continue;
      }

      const raw = s.substring(i, to);
      if (!oldSingleCheck(raw)) {
        return false;
      }
    }
    return true;
  };

}


/**
 * Checks a single emoji for validity. Has unknown results for sequences of more than one.
 *
 * @param {string} s to check
 * @return {boolean}
 */
 export let supported = (s) => {
  prepare();
  return supported(s);
};


/**
 * Prepares the measure module. This will throw an exception if we're e.g. in Node where rendering
 * is unsupported.
 *
 * @param {boolean=} debug
 * @throws {TypeError}
 */
export function prepare(debug = false) {
  try {
    supported = buildContextSupported(debug);
  } catch (e) {
    supported = () => true;
    throw e;
  }
}
