
const groupRe = /\b((?:sub|)group): (.*)\s*?/;

/**
 * Parses emoji-test data into an array.
 *
 * @param {string} raw
 * @return {{emoji: string, version: number, description: string}[]}
 */
export function parser(raw) {
  const lines = raw.split('\n');
  const all = [];

  let groupName = undefined;
  let subgroupName = undefined;

  for (const line of lines) {
    const commentIndex = line.indexOf('#');
    const comment = line.substr(commentIndex + 1).trim();

    if (commentIndex < 60) {
      if (commentIndex === -1) {
        continue;
      }
      const m = groupRe.exec(comment);

      if (m) {
        const type = m[1];
        const name = m[2];

        switch (type) {
          case 'group':
            groupName = name;
            subgroupName = undefined;
            break;

          case 'subgroup':
            subgroupName = name;
            break;

          default:
            throw new Error(`bad group type: ${type}`)
        }
      }

      continue;
    }

    if (!line.includes('fully-qualified')) {
      continue;
    }

    let version = 0.0;
    const [emoji, ...rest] = comment.split(' ');

    if ((rest[0] ?? '').startsWith('E')) {
      version = parseFloat(rest[0].substr(1)) || 0.0;
      rest.shift();
    }
    const description = rest.join(' ');

    all.push({
      emoji,
      version,
      description,
      group: groupName,
      subgroup: subgroupName,
    });
  }

  return all;
}
