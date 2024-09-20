import type { EmojiLine } from './parser.ts';
import { splitFixed } from './string.ts';

function countSkinTone(s: string) {
  let count = 0;
  s.replaceAll(/[\u{1f3fb}\u{1f3fc}\u{1f3fd}\u{1f3fe}\u{1f3ff}]/gu, () => {
    ++count;
    return '';
  });
  return count;
}

const isStandardPart = (part: string) => {
  return (
    isSkinTone(part) || ['woman', 'man', 'person', 'girl', 'boy', 'child', 'adult'].includes(part)
  );
};

const isSkinTone = (part: string) => part.endsWith(' skin tone');

type EmojiClassify = EmojiLine & { base?: string; isTone?: true; hasTone?: number };

export function classifyAllEmoji(i: Iterable<EmojiLine>) {
  const all = [...i];

  const keyToEmoji: Record<string, string> = {};
  const out: Record<string, EmojiClassify> = {};

  for (const e of all) {
    const p = descriptionParts(e.description);
    console.info(e.emoji, JSON.stringify(p));
    continue;

    const [left, right] = splitFixed(e.description, ': ', 2);

    // not interesting; add verbatim
    if (!right || ['flag', 'keycap'].includes(left)) {
      out[e.emoji] = { ...e };
      continue;
    }

    const parts = right.split(', ');
    const lastPart = parts.at(-1)!;
    let descriptor: string | undefined;

    // this is "beard", "curly hair" etc
    if (!isStandardPart(lastPart)) {
      descriptor = parts.pop()!;

      if (!['person', 'man', 'woman'].includes(left)) {
        throw new Error(`got unexpected descriptor on: ${left}`);
      }
      const key = `${descriptor}:${left}`;

      if (parts.length === 0) {
        out[e.emoji] = { ...e };
        keyToEmoji[key] = e.emoji;
      } else if (parts.length !== 1 || !isSkinTone(parts[0])) {
        throw new Error(`got unknown parts on: ${left} ${parts}`);
      } else {
        const baseEmoji = keyToEmoji[key];

        out[e.emoji] = { ...e, base: baseEmoji, isTone: true };

        const base = out[baseEmoji];
        base!.hasTone = 1;
      }
      // TODO: mark as tone-able
      continue;
    }

    console.info(left, { parts, descriptor });
  }

  console.info(JSON.stringify(out, null, 2));
}

export type DescriptionParts = {
  root: boolean;
  name: string;

  direction?: string; // l, r, u, d, 'o' (oncoming)
};

export function descriptionParts(description: string): DescriptionParts {
  const [left, right] = splitFixed(description, ': ', 2);

  // not interesting
  if (['flag', 'keycap'].includes(left) || !right) {
    return { root: true, name: description };
  }

  const parts = right.split(', ');
  const lastPart = parts.at(-1)!;
  let descriptor: string | undefined;

  // TODO: still has gender
  let rootName: string;

  // this is "beard", "curly hair" etc
  if (!isStandardPart(lastPart)) {
    descriptor = parts.pop()!;

    if (!['person', 'man', 'woman'].includes(left)) {
      // we only expect this to qualify basic humans
      throw new Error(`got unexpected descriptor on: ${left}`);
    } else if (parts.length > 1 || (parts.length === 1 && !isSkinTone(parts[0]))) {
      // either zero or one skin tones
      throw new Error(`got unknown parts on: ${left} ${JSON.stringify(parts)}`);
    }

    if (parts.length === 0) {
      return { root: true, name: description };
    }

    // we rewrite this to look a bit more normal
    rootName = `${descriptor} ${left}`;
  } else {
    rootName = left;
  }

  let toneCount = 0;
  while (parts.length && isSkinTone(parts.at(-1)!)) {
    parts.pop();
    ++toneCount;
  }

  let pt: string[] | undefined;
  if (parts.length) {
    // if we have parts, these must be gender/adult/child etc and these will NOT be in the name
    pt = parts.slice();
    parts.splice(0, parts.length);
  }

  return {
    root: false,
    name: rootName,
    ...(toneCount ? { tones: toneCount } : null),
    ...(pt?.length ? { pt } : null),
  };
}
