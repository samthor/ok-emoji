
import {emojiPointCount, iterateEmoji, isFlagPoint} from './emoji.js';

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

/**
 * @param {{width: number, height: number}}
 * @return {{w: number, h: number}}
 */
function cloneSize({width, height}) {
  return {w: width, h: height};
}

// render a char that will show up as an invalid Unicode square box
measurer.textContent = '\u{ffffd}';
const invalidBoxSize = cloneSize(measurer.getBoundingClientRect());

// render an emoji
measurer.textContent = '\u{1f602}';
const validEmojiSize = cloneSize(measurer.getBoundingClientRect());

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

export function testHackMeasure(s) {
  measurer.textContent = s;
  const rect = measurer.getBoundingClientRect();
  return {width: rect.width, height: rect.height};
}

/**
 * @param {string} s
 * @return {boolean} whether this is a single valid point (width is single, and not an invalid box)
 */
export function isSingleValidPoint(s) {
  measurer.textContent = s;
  const {width, height} = measurer.getBoundingClientRect();

  const len = Math.round(width / (letterSpacing + fontSize));
  if (len !== 1) {
    return false;  // expected single char
  }
  return invalidBoxSize.h !== height && invalidBoxSize.w !== width - letterSpacing;
}

/**
 * @param {string} s
 * @return {boolean} whether this is the expected length of an emoji-only string
 */
export const isExpectedLength = (function() {
  if (false && fixedWidthEmoji) {
    const canvas = /** @type {!HTMLCanvasElement} */ (document.createElement('canvas'));
    const context = /** @type {!CanvasRenderingContext2D} */ (canvas.getContext('2d'));
    context.font = '1px monospace';  // only used by Mac/Android for now, invalid for Windows
    const expectedWidth = context.measureText('\u{1f602}').width;  // fixed width of emoji

    return function isExpectedLength(s) {
      const expected = emojiPointCount(s);
      const width = context.measureText(s).width;
      const actual = width / expectedWidth;
      if (~~actual !== actual) {
        return false;  // must be whole emoji chars
      }
      return actual <= expected;
    };
  }

  // isExpectedLength implementation for variable width environments (anywhere but Apple or
  // Android). Windows, Linux and others render emoji with variable width.
  return function isExpectedLength(s) {
    const expected = emojiPointCount(s);
    const renderPoints = countRenderPoints(s);
    if (renderPoints > expected) {
      return false;  // early out, catches uncombinables
    }

    // iterate through emoji parts, check all of them for validity
    for (const part of iterateEmoji(s)) {
      if (part === null) {
        return false;  // got invalid part
      }

      // special-case flags, which we get in bulk
      if (isFlagPoint(part[0])) {
        console.debug('checking flag', String.fromCodePoint(...part));
        if (part.length % 2) {
          return false;  // flags must be pairs
        }
        for (let i = 0; i < part.length; i += 2) {
          const text = String.fromCodePoint(part[i], part[i+1]);
          if (!isSingleValidPoint(text)) {
            return false;
          }
        }
        continue;
      }

      // check is single char
      const text = String.fromCodePoint(...part);
      console.debug('checking', text);
      if (!isSingleValidPoint(text)) {
        return false;
      }
    }

    return true;
  };
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