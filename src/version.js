/**
 * @fileoverview Guesses which version of emoji is supported by the current browser.
 *
 * Uses a HTML canvas, prefers OffscreenCanvas if available.
 */

/**
 * @param {(check: string) => number} widthHelper
 * @return {number}
 */
function internalDetermine(widthHelper) {
  /** @type {(text: string) => boolean} */
  const zwjSupported = (text) => {
    const parts = text.split('\u200d').map(widthHelper);
    if (parts.length === 1) {
      throw new TypeError(`not a real ZWJ: ${text}`);
    }
    const sum = parts.reduce((a, b) => a + b, 0);
    const whole = widthHelper(text);
    return whole < sum;
  };

  // check "WOMAN: BEARD" and "HEART ON FIRE"
  if (zwjSupported('🧔‍♀️') && zwjSupported('❤️‍🔥')) {
    return 131;
  }

  // check "MAN WITH VEIL", "MX CLAUS", "POLAR BEAR", "TRANSGENDER FLAG", and "MAN FEEDING BABY: DARK SKIN"
  // Android 11 (possibly beta) doesn't support "POLAR BEAR" or "TRANSGENDER FLAG" (but supports
  // all non-ZWJ), and other platforms might be similar. Check for a minimum of 2/5.
  const check13 = [
    '👰‍♂️',
    '🧑‍🎄',
    '🐻‍❄️',
    '🏳️‍⚧️',
    '🧑🏿‍🍼',
  ];
  let support13Count = 0;
  for (const check of check13) {
    if (zwjSupported(check) && ++support13Count >= 2) {
      return 130;
    }
  }

  // check "JUDGE" and "PERSON: RED HAIR" (non-gendered)
  if (zwjSupported('🧑‍⚖️') && zwjSupported("🧑‍🦰")) {
    return 121;
  }

  // check "SERVICE DOG" and "WOMAN IN MOTORIZED WHEELCHAIR: DARK SKIN TONE"
  if (zwjSupported('🐕‍🦺') && zwjSupported("👩🏿‍🦼")) {
    return 120;
  }

  // check "WOMAN: CURLY HAIR" and "LEG: DARK SKIN TONE"
  if (zwjSupported('👩‍🦱') && zwjSupported('🦵🏿')) {
    return 110;
  }

  // check "WOMAN IN LOTUS POSITION: MEDIUM SKIN TONE"
  if (zwjSupported('🧘🏽‍♀️')) {
    return 50;
  }

  // check "TRANSGENDER FLAG"
  if (zwjSupported('🏳‍🌈')) {
    return 40;
  }

  // Emoji 3.0 doesn't have ZWJs to check.
  // It does introduce some body parts with skin tones, e.g. "🤙🏾", which aren't ZWJs but could work.

  // check "KISS: WOMAN, MAN"
  if (zwjSupported('👩‍❤️‍💋‍👨')) {
    return 20;
  }

  // at some point, it's not useful to continue (that was about 11.0)
  return 0;
}

/**
 * Guesses which version of emoji is supported by this environment. Returns zero if unsupported or
 * unknown, including in non-browser-based environments.
 *
 * @return {number}
 */
export default function determineEmojiSupport() {
  let canvas;
  try {
    canvas = new OffscreenCanvas(16, 16);
  } catch (e) {
    if (typeof document === 'undefined') {
      return 0;
    }
    canvas = document.createElement('canvas');
    canvas.width = canvas.height = 16;
  }
  const context = canvas.getContext('2d');
  if (!context) {
    return 0;
  }
  context.font = 'sans-serif 16px';

  /** @type {(text: string) => number} */
  const widthHelper = (text) => context.measureText(text).width;
  return internalDetermine(widthHelper);
}
