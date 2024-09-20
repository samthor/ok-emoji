export function splitFixed(raw: string, by: string, count: number) {
  count = ~~count;
  if (count <= 0) {
    throw new Error('bad');
  }

  const out = raw.split(by, count);
  let beforeLength = 0;
  for (let i = 0; i < out.length - 1; ++i) {
    beforeLength += out[i].length + by.length;
  }
  out[out.length - 1] = raw.substring(beforeLength);

  return out;
}
