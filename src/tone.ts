import { isStandardPart } from './classify-description.ts';
import { splitFixed } from './string.ts';

export const tonesToFitz: Record<string, string> = {};
export const fitzTones = ['light', 'medium-light', 'medium', 'medium-dark', 'dark'];

fitzTones.forEach((tone, index) => (tonesToFitz[tone + ' skin tone'] = String(index + 1)));

function toneStrByNo(no: number) {
  return fitzTones[no] + ' skin tone';
}

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

  if (tones.length === 5) {
    return tones.map((emoji, index) => [emoji, insert(toneStrByNo(index))]);
  } else if (tones.length === 25) {
    return tones.map((emoji, index) => {
      const terms = [toneStrByNo(Math.floor(index / 5)), toneStrByNo(index % 5)];
      if (terms[1] === terms[0]) {
        terms.pop();
      }
      return [emoji, insert(terms.join(', '))];
    });
  } else {
    throw new Error(`unknown tones length: ${tones.length}`);
  }
}
