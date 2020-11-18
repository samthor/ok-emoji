#!/usr/bin/env node

import fs from 'fs';

import {parser} from './gen/parser.js';

const data = fs.readFileSync('emoji-test.txt', 'utf-8');
const all = parser(data);

const byVersion = {};

for (const {emoji, version, description} of all) {
  const v = `E${version.toFixed(1)}`;

  if (!(v in byVersion)) {
    byVersion[v] = [];
  }
  const target = byVersion[v];

  target.push({emoji, description});
}

const sortVersion = (a, b) => parseFloat(a.substr(1)) - parseFloat(b.substr(1));
const out = [];

Object.keys(byVersion).sort(sortVersion).forEach((version) => {
  out.push({version, all: byVersion[version]});
});

process.stdout.write(JSON.stringify(out));