/**
 * Splits the raw input into at most `count` substrings split by `by`. The last segment contains
 * the rest of the string.
 *
 * This may return fewer components.
 */
export function splitFixed(raw: string, by: string, count: number) {
  const out: string[] = [];

  let index = 0;
  for (let i = 0; i < count - 1; ++i) {
    const updatedIndex = raw.indexOf(by, index);
    if (updatedIndex === -1) {
      break;
    }

    out.push(raw.substring(index, updatedIndex));
    index = updatedIndex + by.length;
  }

  if (count >= 1) {
    out.push(raw.substring(index));
  }

  return out;
}

/**
 * Cache helper, just used for legacy for now.
 */
export function buildCache(
  helper: (raw: string) => boolean | undefined,
): (raw: string) => boolean | undefined {
  const m = new Map<string, boolean | undefined>();

  return (raw: string) => {
    if (m.has(raw)) {
      return m.get(raw);
    }

    // laziest FIFO cache ever
    if (m.size === 2_000) {
      for (const firstKey of m.keys()) {
        m.delete(firstKey);
        break;
      }
    }

    const out = helper(raw);
    m.set(raw, out);
    return out;
  };
}
