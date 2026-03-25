/**
 * The "zero-width-joiner" character.
 */
export const runeZWJ = 0xfe0f;

/**
 * Special cases when converting long descriptions to dashed strings.
 */
export const specialDashCase: Record<string, string> = {
  'keycap: #': 'keycap-hash',
  'keycap: *': 'keycap-star',
};

/**
 * Replacements to run when generating friendly names.
 */
export const friendlyReplacements: [RegExp, string][] = [
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
 * These require person types as a suffix, not a prefix.
 *
 * e.g., "kiss: woman, man"
 */
export const expandAllDescription = ['family', 'couple with heart', 'kiss'];

/**
 * Fitzpatrick tones lookup.
 */
export const fitzTones = ['light', 'medium-light', 'medium', 'medium-dark', 'dark'];
export const tonesToFitz: Record<string, string> = {};
fitzTones.forEach((tone, index) => (tonesToFitz[tone + ' skin tone'] = String(index + 1)));

/**
 * Special names for person type groups.
 *
 * The right side (`raw` and `name`) matches how our code naïvely identifies the emoji, but the key is the effective name.
 * For example, "woman" and "merperson" should be "mermaid", not "woman merperson".
 */
export const specialNamePersonType: Record<string, { raw: string; name: string }> = {
  // --child case (no other emoji child)
  child: { raw: 'person', name: 'child' },
  boy: { raw: 'man', name: 'child' },
  girl: { raw: 'woman', name: 'child' },

  // --base person case (need sensible name)
  person: { raw: 'person', name: 'person' },
  man: { raw: 'man', name: 'person' },
  woman: { raw: 'woman', name: 'person' },

  // --merpeople
  merperson: { raw: 'person', name: 'merperson' },
  merman: { raw: 'man', name: 'merperson' },
  mermaid: { raw: 'woman', name: 'merperson' },

  // --royalty
  // 'person with crown': { raw: 'person', name: 'with crown' }, // redundant
  prince: { raw: 'man', name: 'with crown' },
  princess: { raw: 'woman', name: 'with crown' },

  // --santa
  'Mx Claus': { raw: 'person', name: 'santa' },
  'Santa Claus': { raw: 'man', name: 'santa' },
  'Mrs. Claus': { raw: 'woman', name: 'santa' },

  // --old
  'older person': { raw: 'person', name: 'old' },
  // 'old man': { raw: 'man', name: 'old' }, // redundant
  // 'old woman': { raw: 'woman', name: 'old' }, // redundant
};
