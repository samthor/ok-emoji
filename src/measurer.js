
import {emojiPointCount, iterateEmoji, isFlagPoint} from './emoji.js';

// are we on a platform where emoji are all 1.0 width?
const fixedWidthEmoji =
    Boolean(/Mac|iP(hone|od|ad)/.exec(navigator.platform)) ||  // Mac and iOS
    Boolean(/Android/.exec(navigator.userAgent))           ||  // Android
    false;

const letterSpacing = 1024;  // must be sensibly large enough so we round over emoji
const fontSize = 100;        // large enough to unambiguate other wide chars

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
measurer.style.fontFamily = 'sans-serif';

hider.appendChild(measurer);
document.body.appendChild(hider);

/**
 * @return {{width: number, height: number}}
 */
function measure() {
  // use the height of the hider, as it grows to expand 'large' chars (the measurer itself doesn't)
  // grow, it just renders 'outside'
  const box = hider.getBoundingClientRect();
  return {width: measurer.offetWidth, height: hider.offsetHeight};
}

// render a char that will show up as an invalid Unicode square box
measurer.textContent = '\u{ffffd}';
const invalidBoxSize = measure();

// render an emoji
measurer.textContent = '\u{1f602}';
const validEmojiSize = measure();

// check invalid vs emoji
const useInvalidHeight = (validEmojiSize.height !== invalidBoxSize.height);
export const isSingleAmbig = !useInvalidHeight && !fixedWidthEmoji;
if (isSingleAmbig) {
  // This is somewhat unlikely, but possible. In this case, we can't tell single characters from
  // emoji, because everything has the same height.
  console.warn(`unable to tell single char from emoji char`);
} else {
  // If we have to use this (because we're variable-width), it's still possible that certain
  // Unicode characters will be detected as emoji, because they have the same height— e.g.,
  // certain Japanese characters.
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

  // nb. The choice of canvasFontSize leverages weird Mac quirks. Using e.g. 1 or 100 doesn't
  // work; 10.5 seems to work well, because other fixed-width single-chars are different size.
  // Ostensibly, emoji don't like to render on pixel widths, and on macOS 10.13 it rounds up to 14.
  const canvasFontSize = 10.5;

  const canvas = /** @type {!HTMLCanvasElement} */ (document.createElement('canvas'));
  const context = /** @type {!CanvasRenderingContext2D} */ (canvas.getContext('2d'));
  context.font = `${canvasFontSize}px monospace`;
  const expectedWidth = context.measureText('\u{1f602}').width;  // fixed width of emoji

  return function fixedWidthMeasure(s) {
    const width = context.measureText(s).width;
    console.info('got width', width, s);
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
    const rect = measure();

    const len = Math.round(rect.width / (letterSpacing + fontSize));
    if (len !== 1) {
      return false;  // expected single char
    } else if (useInvalidHeight && validEmojiSize.height !== rect.height) {
      return false;  // invalid height is useful, and we're not equal
    }
    return invalidBoxSize.width !== rect.width - letterSpacing;
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
