import { type DescriptionParts, descriptionParts } from './classify-description.ts';
import type { EmojiLine } from './parser.ts';

export function classifyAllEmoji(i: Iterable<EmojiLine>) {
  const src = [...i];

  const allByName: Record<string, ({ emoji: string } & DescriptionParts)[]> = {};

  for (const e of src) {
    let p: DescriptionParts;
    if (e.qualifier !== 'component') {
      p = descriptionParts(e.description);
    } else {
      p = { name: `component: ${e.description}` };
    }

    let all = allByName[p.name];
    if (all === undefined) {
      all = [];
      allByName[p.name] = all;
    }
    all.push({ emoji: e.emoji, ...p });
  }

  for (const [name, all] of Object.entries(allByName)) {
    // find the max of everything and reconcile the rest
    let toneCount = 0;
    const hasDir = new Set<string>();
    const hasPt = new Set<string>(); // TODO: not sure how to reconcile "base"

    for (const each of all) {
      toneCount = Math.max(each.tones?.length ?? 0, toneCount);
      each.dir && hasDir.add(each.dir);
      each.pt && hasPt.add(each.pt);
    }
    if (!toneCount && !hasDir.size && !hasPt.size) {
      continue;
    }

    // some of 'all' might not know about these
    for (const each of all) {
      const localToneCount = each.tones?.length ?? 0;

      // update skin tones

      if (localToneCount === toneCount) {
        // ok
      } else if (localToneCount === 0) {
        // this is the "zero" to the count
        each.tones = ''.padEnd(toneCount, '_'); // indicate via right number of _'s
      } else {
        if (localToneCount !== 1 || toneCount !== 2) {
          throw new Error(
            `unexpected total toneCount=${toneCount} localToneCount=${localToneCount}`,
          );
        }
        // double the singular tone
        each.tones = each.tones! + each.tones!;
      }

      // update dir
      if (!each.dir && hasDir.has('right')) {
        each.dir = 'left';
      }

      // update pt
      if (!each.pt && hasPt.size) {
        if (hasPt.has('m') && hasPt.has('w') && hasPt.size === 2) {
          // we are the person to other m/f
          each.pt = 'p';
        } else if (name === 'kiss' || name === 'couple with heart') {
          // this is the "same tone" pp, which is just the modifier of a simple emoji
          each.pt = 'pp';
        } else if (name === 'family') {
          if (each.emoji !== '👪') {
            throw new Error(`unknown family: ${each.emoji}`);
          }
          // TODO: this is "1F46A" and is conceptually same as "1F9D1 200D 1F9D1 200D 1F9D2"
          // _both_ render as "ppc" (adult/adult/child)
          each.pt = '?';
        } else {
          throw new Error(`unknown pt resolution: ${name}`);
        }
      }
    }

    //    console.info(name, '=>', { all: all.length, toneCount, hasDir, hasPt });
  }

  const groups: Record<string, string> = {};

  for (const [name, all] of Object.entries(allByName)) {
    const renders = all.map((each) => {
      const parts = [each.emoji, each.pt ?? '', each.tones ?? '', each.dir ?? ''];
      while (parts.at(-1) === '') {
        parts.pop();
      }
      return parts.join(',');
    });

    const s = new Set(renders);
    if (s.size !== renders.length) {
      throw new Error(`got eventual dup: ${renders}`);
    }

    groups[name] = renders.join('|');
  }

  console.info(JSON.stringify(groups, null, 2));
}
