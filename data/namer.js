
const overrides = {
  'o’clock': 'O\'Clock',
  'd’Ivoire': 'd\'Ivoire',
  'dvd': 'DVD',
  'dna': 'DNA',
  'zzz': 'ZZZ',
};

function toTitleCase(s) {
  const override = overrides[s];
  if (override) {
    return override;
  }

  s = s.replace('’', '\'');
  s = s.replace('“', '"');
  s = s.replace('”', '"');

  const parts = s.split('-')
  return parts.map((p) => p ? p[0].toUpperCase() + p.slice(1) : '').join('-')
}

export default function nameForEmoji(description) {
  return description.split(/\s+/g).map(toTitleCase).join(' ');
}
