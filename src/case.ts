const expectedDashReplacements: Record<string, string> = {
  ñ: 'n',
  Å: 'A',
  é: 'e',
  ô: 'o',
  ç: 'c',
  å: 'a',
  ã: 'a',
  í: 'i',
  ü: 'u',
};

const specialDashCase: Record<string, string> = {
  'keycap: #': 'keycap-hash',
  'keycap: *': 'keycap-star',
};

/**
 * Converts the raw description from the Emoji corpus into a lower-case dash-case format. This
 * should return a string matching the regular expression `[a-z0-9]+(-[a-z0-9]+)*`.
 *
 * Because it normalizes the input, this should be the same for the friendly name or the raw
 * description data.
 */
export function dashCase(raw: string) {
  if (raw in specialDashCase) {
    return specialDashCase[raw];
  }

  return raw
    .toLowerCase()
    .replaceAll(/[^\w :-]/g, (c) => expectedDashReplacements[c] ?? '')
    .split(/[^\w]/g)
    .filter((x) => x)
    .join('-');
}

const friendlyReplacements: [RegExp, string][] = [
  // fix bad quotes
  [/[“”]/g, `"`],
  // fix apostrophe
  [/’/g, `'`],
  // fix "Woman'S clothes"
  [/'S\b/g, `'s`],
  // fix "D'Ivoire"
  [/\bD'/g, `d'`],
];

/**
 * Converts the raw description from the Emoji corpus into a relatively friendly display title.
 */
export function friendlyCase(raw: string) {
  if (raw.length === 3 && /[^aeiou]{2}\w/.test(raw)) {
    // catches DVD/DNA (consonant / consonant / any)
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
