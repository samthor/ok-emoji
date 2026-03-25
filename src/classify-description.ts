import { splitFixed } from './helper.ts';
import { tonesToFitz } from './const.ts';
import { specialNamePersonType } from './const.ts';

/**
 * Describes an emoji, including its base name plus:
 *
 * - whether it has a skin tone
 * - whether it has a person type (e.g. "wm" for woman-man holding hands)
 * - if it has a strict direction.
 */
export type DescriptionParts = {
  name: string;
  tones?: string;
  pt?: string;
  dir?: 'left' | 'right';
};

/**
 * Performs a naïve run over the description in order to work out its component parts.
 *
 * Does this without any context, but provides a new `name` to use as key.
 */
export function descriptionParts(description: string): DescriptionParts {
  const dp = descriptionPartsStepTone(description);

  if (!dp.pt) {
    const update = extractNamePersonType(dp.name);
    if (update) {
      dp.name = update.name;
      dp.pt = update.pt;
    }
  }

  dir: {
    if (dp.name.includes('arrow')) {
      break dir; // skip all dir stuff
    }

    const sm = / (?:facing )?(right|left)$/.exec(dp.name);
    if (sm) {
      dp.name = dp.name.substring(0, dp.name.length - sm[0].length);
      dp.dir = sm[1] as 'left' | 'right';
      break dir;
    }

    const pm = /^(left|right)(?:wards|-facing) /.exec(dp.name);
    if (pm) {
      dp.name = dp.name.substring(pm[0].length);
      dp.dir = pm[1] as 'left' | 'right';
      break dir;
    }
  }

  return dp;
}

function extractNamePersonType(name: string) {
  const m = (() => {
    if (name in specialNamePersonType) {
      return specialNamePersonType[name];
    }

    // look for prefix (lots of options)
    const pm = /^(people|man and woman|woman and man|men|women|person|man|woman)(\s+|$)/.exec(name);
    if (pm) {
      return { raw: pm[1], name: name.substring(pm[1].length).trim() };
    }

    // look for suffix (few options)
    // this catches the 'component' rewrites, plus three built-ins:
    //  - old {gender}
    //  - deaf {gender}
    //  - pregnant {gender}
    const sm = /^(.*) (person|man|woman)$/.exec(name);
    if (sm) {
      return { raw: sm[2], name: sm[1] };
    }
  })();

  if (!m) {
    return;
  }

  const pt = flattenLongPersonType(m.raw);
  if (!pt) {
    throw new Error(`bad raw pt: ${m.raw}`);
  }
  return { name: m.name, pt };
}

/**
 * Sorts a person type key, made of "pwmcgb" characters.
 */
export function sortPersonKey(a: string, b: string) {
  for (let i = 0; i < Math.max(a.length, b.length); ++i) {
    const orderA = personKeyOrder.indexOf(a[i] ?? ' ');
    const orderB = personKeyOrder.indexOf(b[i] ?? ' ');

    if (orderA !== orderB) {
      return orderA - orderB;
    }
  }

  return 0;
}

const personKeyOrder = 'pwmcgb';

// abbreviations for person types
export const personTypeAllData: Record<string, string> = {
  '?': 'default',
  p: 'person', // replaced to 'adult' when only children exist
  w: 'woman',
  m: 'man',
  c: 'child',
  g: 'girl',
  b: 'boy',

  a: 'adult',

  ww: 'women',
  wm: 'woman and man',
  mw: 'man and woman',
  mm: 'men',
  pp: 'people',
};

/**
 * Converts a person type string into one of:
 *   - (p)erson
 *   - (w)oman
 *   - (m)an
 *   - (c)hild
 *   - (g)irl
 *   - (b)oy
 *
 * Or multiple of those (max 2).
 */
function flattenLongPersonType(raw: string): string | undefined {
  switch (raw) {
    case 'people':
      return 'pp';
    case 'man and woman':
      return 'mw';
    case 'woman and man':
      return 'wm';
    case 'men':
      return 'mm';
    case 'women':
      return 'ww';
    case 'man':
      return 'm';
    case 'woman':
      return 'w';
    case 'person':
    case 'adult':
      return 'p';
    case 'child':
      return 'c';
    case 'boy':
      return 'b';
    case 'girl':
      return 'g';
    default:
      return undefined;
  }
}

/**
 * Classifies the source description into {@link DescriptionParts} by finding the tone and descriptor
 * genders.
 */
function descriptionPartsStepTone(description: string): DescriptionParts {
  const [left, right] = splitFixed(description, ': ', 2);

  // not interesting
  if (['flag', 'keycap'].includes(left) || !right) {
    return { name: description };
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

    // we rewrite this to look a bit more normal, but "~" as distinguisher from component itself
    rootName = `${descriptor} ${left}`;

    if (parts.length === 0) {
      // we don't know anything about this (but proably will be fixed later)
      return { name: rootName };
    }
  } else {
    rootName = left;
  }

  // consume person types from front
  const pt = parts.map((p) => flattenLongPersonType(p) ?? '').join('');
  const tones = parts.map((p) => tonesToFitz[p] ?? '').join('');

  return {
    name: rootName,
    ...(tones.length ? { tones } : null),
    ...(pt.length ? { pt } : null),
  };
}

export const isStandardPart = (part: string) => {
  return (
    isSkinTone(part) || ['woman', 'man', 'person', 'girl', 'boy', 'child', 'adult'].includes(part)
  );
};

const isSkinTone = (part: string) => part.endsWith(' skin tone');
