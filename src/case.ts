import { specialDashCase, friendlyReplacements } from './const.ts';

/**
 * Converts the raw description from the Emoji corpus into a lower-case dash-case format.
 * This must return a string matching the regular expression `[a-z0-9]+(-[a-z0-9]+)*`.
 *
 * Because it normalizes the input, this should be the same for the friendly name via {@link friendlyCase} or the raw description data.
 */
export function dashCase(raw: string) {
  if (raw in specialDashCase) {
    return specialDashCase[raw];
  }

  return raw
    .normalize('NFD') // decompose letters into base + diacritics
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .toLowerCase()
    .replace(/[^\w :-]/g, '')
    .split(/[^\w]/g)
    .filter((x) => x)
    .join('-');
}

/**
 * Converts the raw description from the Emoji corpus into a relatively friendly display title.
 */
export function friendlyCase(raw: string) {
  if (raw.length === 3 && /[^aeiou]{2}\w/.test(raw)) {
    // catches DVD/DNA (consonant / consonant / any) - should always be an INITIALISM
    return raw.toUpperCase();
  }

  raw = raw.replaceAll(/[\p{Alphabetic}\p{Number}]+/gu, (arg) => {
    return arg[0].toUpperCase() + arg.substring(1);
  });

  for (const [regexp, repl] of friendlyReplacements) {
    raw = raw.replaceAll(regexp, repl);
  }

  return raw;
}
