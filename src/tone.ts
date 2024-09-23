import { isStandardPart } from './classify-description.ts';
import { tonesForEmoji } from './forms.ts';
import { splitFixed } from './string.ts';

export const tonesToFitz: Record<string, string> = {};
export const fitzTones = ['light', 'medium-light', 'medium', 'medium-dark', 'dark'];

fitzTones.forEach((tone, index) => (tonesToFitz[tone + ' skin tone'] = String(index + 1)));

export function expandTones(name: string, tones?: string[]): [string, string][] {
  if (!tones?.length) {
    return [];
  }

  const suffix = name.includes(':') ? ',' : ':';
  let insert: (s: string) => string = (s) => `${name}${suffix} ${s}`;

  // look for "person: beard" case, tone goes before 'beard'
  normal: if (suffix === ',') {
    const [left, right] = splitFixed(name, ': ', 2);
    const parts = right.split(', ');

    for (const p of parts) {
      if (isStandardPart(p)) {
        break normal;
      }
    }
    insert = (s) => `${left}: ${s}, ${right}`;
  }

  return tones.map((emoji) => [emoji, insert(tonesDescription(emoji))]);
}

/**
 * Return the comma-separated description of the skin tones in this emoji. Returns blank if none.
 */
export function tonesDescription(emoji: string): string {
  const t = tonesForEmoji(emoji);
  if (!t) {
    return '';
  }
  return t.map((r) => `${fitzTones[r - 0x1f3fb]} skin tone`).join(', ');
}
