import { type DescriptionParts, descriptionParts, sortPersonKey } from './classify-description.ts';
import type { EmojiLine } from './parser.ts';

export type ClassifyEach = { line: EmojiLine; dp: DescriptionParts };
export type ClassifyOut = Record<string, ClassifyEach[]>;

export function classifyAllEmoji(i: Iterable<EmojiLine>): ClassifyOut {
  const src = [...i];

  const allByName: ClassifyOut = {};

  // group emoji by root key
  for (const e of src) {
    let p: DescriptionParts;
    if (e.qualifier === 'component') {
      p = { name: `~${e.description}` };
    } else {
      p = descriptionParts(e.description);
    }

    let all = allByName[p.name];
    if (all === undefined) {
      all = [];
      allByName[p.name] = all;
    }
    all.push({ line: e, dp: p });
  }

  // for every group...
  for (const [name, all] of Object.entries(allByName)) {
    if (all.length > 1) {
      reconcileKeyGroup(name, all);
    }
  }

  return allByName;
}

export function reconcileKeyGroup(name: string, all: ClassifyEach[]) {
  // find the max of everything and reconcile the rest
  let toneCount = 0;
  const hasDir = new Set<string>();
  const hasPt = new Set<string>(); // TODO: not sure how to reconcile "base"

  for (const each of all) {
    toneCount = Math.max(each.dp.tones?.length ?? 0, toneCount);
    each.dp.dir && hasDir.add(each.dp.dir);
    each.dp.pt && hasPt.add(each.dp.pt);
  }
  if (!toneCount && !hasDir.size && !hasPt.size) {
    return; // not an interesting emoji
  }

  // some of 'all' might not know about these
  for (const each of all) {
    const localToneCount = each.dp.tones?.length ?? 0;

    // update skin tones
    if (localToneCount === toneCount) {
      // ok
    } else if (localToneCount === 0) {
      // this is the "zero" to the count
      each.dp.tones = ''.padEnd(toneCount, '_'); // indicate via right number of _'s
    } else {
      if (localToneCount !== 1 || toneCount !== 2) {
        throw new Error(`unexpected total toneCount=${toneCount} localToneCount=${localToneCount}`);
      }
      // double the singular tone
      each.dp.tones = each.dp.tones! + each.dp.tones!;
    }

    // update dir
    if (!each.dp.dir && hasDir.has('right')) {
      each.dp.dir = 'left';
    }

    // update pt
    if (!each.dp.pt && hasPt.size) {
      if (hasPt.has('m') && hasPt.has('w') && hasPt.size === 2) {
        // we are the person to other m/f
        each.dp.pt = 'p';
      } else if (name === 'kiss' || name === 'couple with heart') {
        // this is the "same tone" pp, which is just the modifier of a simple emoji
        each.dp.pt = 'pp';
      } else if (name === 'family') {
        if (each.line.emoji !== '👪') {
          throw new Error(`unknown family: ${each.line.emoji}`);
        }
        // TODO: this is "1F46A" and is conceptually same as "1F9D1 200D 1F9D1 200D 1F9D2"
        // _both_ render as "ppc" (adult/adult/child)
        each.dp.pt = '?';
      } else {
        throw new Error(`unknown pt resolution: ${name}`);
      }
    }
  }

  // sort emoji so that tones are ordered together
  all.sort(({ dp: a, line: { emoji: emojiA } }, { dp: b, line: { emoji: emojiB } }) => {
    if (a.pt !== b.pt) {
      if (a.pt === undefined || b.pt === undefined) {
        throw new Error(`both pt must be defined in sort`);
      }
      return sortPersonKey(a.pt, b.pt);
    }

    if (a.dir !== b.dir) {
      if (a.dir === undefined || b.dir === undefined) {
        throw new Error(`both dir must be defined in sort`);
      }
      return a.dir.localeCompare(b.dir);
    }

    if (a.tones !== b.tones) {
      if (a.tones === undefined || b.tones === undefined) {
        throw new Error(`both tones must be defined in sort`);
      }
      return a.tones.localeCompare(b.tones);
    }

    throw new Error(`got same emoji: ${emojiA} / ${emojiB}`);
  });
}
