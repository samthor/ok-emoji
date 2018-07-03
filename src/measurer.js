
import {emojiPointCount} from './emoji.js';

// are we on a platform where emoji are all 1.0 width?
const fixedWidthEmoji = Boolean(/Mac|Android|iP(hone|od|ad)/.exec(navigator.platform));

const letterSpacing = 1024;  // must be sensibly large enough so we round over emoji
const fontSize = 12;

const hider = document.createElement('div');
hider.style.overflow = 'hidden';
hider.style.width = '0px';
hider.style.position = 'absolute';

const measurer = document.createElement('div');
measurer.style.display = 'inline-block';
measurer.style.whiteSpace = 'nowrap';
measurer.style.fontSize = `${fontSize}px`;
measurer.setAttribute('data-info', 'https://github.com/samthor/is-emoji');
measurer.style.fontFamily = fontsFor(navigator.platform);

hider.appendChild(measurer);
document.body.appendChild(hider);

// render a char that will show up as an invalid Unicode square box
measurer.textContent = '\u{ffffd}';
const invalidBoxWidth = measurer.getBoundingClientRect().width;

// render an emoji
measurer.textContent = '\u{1f602}';
const validEmojiWidth = measurer.getBoundingClientRect().width;

// _now_ set letterSpacing for rest
measurer.style.letterSpacing = `${letterSpacing}px`;

/**
 * @param {string} s to measure
 * @return {number} the number (approx) of characters rendered
 */
export function countRenderPoints(s) {
  measurer.textContent = s;
  return Math.round(measurer.offsetWidth / (letterSpacing + fontSize));
}

/**
 * @param {string} s
 * @return {boolean} whether this is a single valid point (width is not invalid box size)
 */
export function isSingleValidPoint(s) {
  measurer.textContent = s;
  const w = measurer.getBoundingClientRect().width;

  const len = Math.round(w / (letterSpacing + fontSize));
  if (len !== 1) {
    return false;  // expected single char
  }
  return invalidBoxWidth !== w - letterSpacing;
}

/**
 * @param {string} s
 * @return {boolean} whether this is the expected length of an emoji-only string
 */
export const isExpectedLength = (function() {
  if (fixedWidthEmoji) {
    const canvas = /** @type {!HTMLCanvasElement} */ (document.createElement('canvas'));
    const context = /** @type {!CanvasRenderingContext2D} */ (canvas.getContext('2d'));
    context.font = '1px monospace';  // only used by Mac/Android for now, invalid for Windows

    return function isExpectedLength(s) {
      const expected = emojiPointCount(s);
      const width = context.measureText(s).width;
      const actual = width / fixedWidthEmoji;
      if (~~actual !== actual) {
        return false;  // must be whole emoji chars
      }
      return actual <= expected;
    };
  }

  // TODO
  return () => undefined;
}());

/**
 * @param {string} platform from navigator.platform
 * @return {string} the fonts to use inside a font-family CSS declaration
 */
function fontsFor(platform) {
  const prefix = platform.substr(0, 3).toLowerCase();
  switch (prefix) {
  case 'win':
    // Windows needs specified fonts (and Courier New, as monospace doesn't work?)
    return `'Segoe UI Emoji', 'Segoe UI Symbol', 'Courier New', monospace`;
  case 'mac':
    return `'Helvetica Neue', 'Helvetica', monospace`;
  default:
    return `'Arial', monospace`;
  }
}