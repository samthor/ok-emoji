/**
 * Splits the raw input into at most `count` substrings split by `by`.
 *
 * The last segment contains the rest of the string.
 * For instance, if `count` is one, simply returns the entire string.
 *
 * Count values <=0 return an empty array.
 *
 * This may return fewer components if there are not enough valid substrings.
 */
export function splitFixed(raw: string, by: string, count: number): string[] {
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
