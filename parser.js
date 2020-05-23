#!/usr/bin/env node

import fs from 'fs';

const data = fs.readFileSync('emoji-test.txt', 'utf-8');
const lines = data.split('\n');

const byVersion = {};

for (const line of lines) {
  if (!line.includes('fully-qualified')) {
    continue;
  }

  const comment = line.indexOf('#');
  if (comment < 60) {
    continue;
  }

  const [emoji, version, ...rest] = line.substr(comment + 1).trim().split(' ');
  const description = rest.join(' ')

  if (!(version in byVersion)) {
    byVersion[version] = [];
  }
  const target = byVersion[version];

  target.push({emoji, description});
}

const sortVersion = (a, b) => parseFloat(a.substr(1)) - parseFloat(b.substr(1));
const out = [];

Object.keys(byVersion).sort(sortVersion).forEach((version) => {
  out.push({version, all: byVersion[version]});
});

process.stdout.write(JSON.stringify(out));