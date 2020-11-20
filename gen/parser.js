
/**
 * Parses emoji-test data into an array.
 *
 * @param {string} raw
 * @return {{emoji: string, version: number, description: string}[]}
 */
export function parser(raw) {
  const lines = raw.split('\n');
  const all = [];

  for (const line of lines) {
    if (!line.includes('fully-qualified')) {
      continue;
    }
  
    const comment = line.indexOf('#');
    if (comment < 60) {
      continue;
    }
  
    const [emoji, v, ...rest] = line.substr(comment + 1).trim().split(' ');
    const description = rest.join(' ');

    if (!v.startsWith('E')) {
      throw new Error(`bad version: ${v}`);
    }
    const version = parseFloat(v.substr(1)) || 0.0;

    all.push({emoji, version, description});
  }

  return all;
}
