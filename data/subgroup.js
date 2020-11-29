
const overrides = {
  'cat-face': true,
  'monkey-face': true,
  'body-parts': true,
  'musical-instrument': true,
  'book-paper': 'Book & Paper',
  'av-symbol': 'AV Symbol',
  'microsoft-cats': true,
  'arts & crafts': 'Arts & Crafts',
  'sky & weather': 'Sky & Weather',
  'light & video': 'Light & Video',
  'alphanum': 'Alphanumeric',
};

function capitalize(s) {
  if (s.length) {
    return s[0].toUpperCase() + s.slice(1);
  }
  return s;
}

export default function nameForSubGroup(subgroup) {
  const override = overrides[subgroup];
  if (typeof override === 'string') {
    return override;
  }

  let prefix = '';

  if (!override) {
    const leftDash = subgroup.indexOf('-');
    if (leftDash > 0) {
      prefix = capitalize(subgroup.slice(0, leftDash)) + ': ';
      subgroup = subgroup.slice(leftDash + 1);
    }
  }

  const parts = subgroup.split('-').filter(Boolean);
  return prefix + parts.map(capitalize).join(' ');
}
