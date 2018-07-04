
import {emojiPointCount, iterateEmoji, isFlagPoint} from './emoji.js';

// are we on a platform where emoji are all 1.0 width?
const debugFixed = false;
const fixedWidthEmoji = debugFixed ||
    Boolean(/Mac|iP(hone|od|ad)/.exec(navigator.platform)) ||  // Mac and iOS
    Boolean(/Android/.exec(navigator.userAgent))           ||  // Android
    false;

const letterSpacing = 1024;  // must be sensibly large enough so we round over emoji
const fontSize = 12;

const hider = document.createElement('div');
hider.style.overflow = 'hidden';
hider.style.width = '0px';
hider.style.position = 'absolute';
hider.setAttribute('href', 'https://github.com/samthor/is-emoji');

const measurer = document.createElement('div');
measurer.style.display = 'inline-block';
measurer.style.whiteSpace = 'nowrap';
measurer.style.fontSize = `${fontSize}px`;
measurer.style.lineHeight = 'normal';
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

// check invalid vs emoji
const useInvalidHeight = (validEmojiSize.h !== invalidBoxSize.h);
export const isSingleAmbig = !useInvalidHeight && !fixedWidthEmoji;
if (isSingleAmbig) {
  // FIXME(samthor): This could be the case on Windows or Linux, depending on their font rendering.
  // We can't tell isSingleValidEmoji here: only "is single point".
  console.warn(`unable to tell single char from emoji char`);
}

// _now_ set letterSpacing for rest
measurer.style.letterSpacing = `${letterSpacing}px`;

/**
 * @type {(null|function(string): number)}
 */
const fixedWidthMeasure = (function() {
  if (!fixedWidthEmoji) {
    return null;
  }

  const canvas = /** @type {!HTMLCanvasElement} */ (document.createElement('canvas'));
  const context = /** @type {!CanvasRenderingContext2D} */ (canvas.getContext('2d'));
  context.font = '1px monospace';  // only used by Mac/Android for now, invalid for Windows
  const expectedWidth = context.measureText('\u{1f602}').width;  // fixed width of emoji

  return function fixedWidthMeasure(s) {
    const width = context.measureText(s).width;
    return width / expectedWidth;
  }
}());

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
 * @return {boolean} whether this is a single valid emoji (width is single, and not an invalid box)
 */
export const isSingleValidEmoji = (function() {
  if (fixedWidthEmoji) {
    return function isSingleValidEmoji(s) {
      return fixedWidthMeasure(s) === 1;
    };
  }

  return function isSingleValidEmoji(s) {
    measurer.textContent = s;
    const rect = measurer.getBoundingClientRect();

    const len = Math.round(rect.width / (letterSpacing + fontSize));
    if (len !== 1) {
      return false;  // expected single char
    } else if (useInvalidHeight && validEmojiSize.h !== rect.height) {
      return false;  // invalid height is useful, and we're not equal
    }
    return invalidBoxSize.w !== rect.width - letterSpacing;
  }
}());

/**
 * @param {string} s
 * @return {boolean} whether this is the expected length of an emoji-only string
 */
export const isExpectedLength = (function() {
  if (fixedWidthEmoji) {
    return function isExpectedLength(s) {
      const actual = fixedWidthMeasure(s);
      const expected = emojiPointCount(s);
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
        if (part.length % 2) {
          return false;  // flags must be pairs
        }
        for (let i = 0; i < part.length; i += 2) {
          const text = String.fromCodePoint(part[i], part[i+1]);
          if (!isSingleValidEmoji(text)) {
            return false;
          }
        }
        continue;
      }

      // check is single char
      const text = String.fromCodePoint(...part);
      if (!isSingleValidEmoji(text)) {
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
    return `monospace`;
  }
}