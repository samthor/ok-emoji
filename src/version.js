
/**
 * @fileoverview Uses the DOM to guess which version of emoji is supported by the current
 * environment.
 */

/**
 * @param {function(string): number} widthHelper
 * @return {number}
 */
function internalDetermine(widthHelper) {
  const zwjSupported = (text) => {
    const parts = text.split('\u200d').map(widthHelper);
    if (parts.length === 1) {
      throw new TypeError(`not a real ZWJ: ${text}`);
    }
    const sum = parts.reduce((a, b) => a + b, 0);
    const whole = widthHelper(text);
    return whole < sum;
  };

  // check "MAN WITH VEIL", "MX CLAUS", "POLAR BEAR", "TRANSGENDER FLAG", and "MAN FEEDING BABY: DARK SKIN"
  // Android 11 (possibly beta) doesn't support "POLAR BEAR" or "TRANSGENDER FLAG" (but supports
  // all non-ZWJ), and other platforms might be similar. Check for a minimum of 2/5.
  const check13 = [
    zwjSupported('👰‍♂️'),
    zwjSupported('🧑‍🎄'),
    zwjSupported('🐻‍❄️'),
    zwjSupported('🏳️‍⚧️'),
    zwjSupported('🧑🏿‍🍼'),
  ];
  const countSupport13 = check13.filter((x) => x).length;
  if (countSupport13 >= 2) {
    return 130;
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

  // at some point, it's not useful to continue
  return 0;
}

/**
 * Guesses which version of emoji is supported by this environment. Returns zero if unsupported or
 * unknown, including in non-browser-based environments.
 *
 * @return {number}
 */
export default function determineEmojiSupport() {
  if (typeof document === 'undefined') {
    return 0;
  }

  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 16;
  const context = canvas.getContext('2d');

  context.fontFamily = 'sans-serif';
  context.fontSize = '16px';

  const widthHelper = (text) => context.measureText(text).width;
  return internalDetermine(widthHelper);
}
