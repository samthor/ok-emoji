#!/usr/bin/env node

/**
 * @fileoverview Generates a list of ungendered emoji.
 */

import fs from 'fs';
import path from 'path';

import {parser} from '../gen/parser.js';
import {isRetainedGenderPerson, normalize} from './normalize.js';
import {genderVariants} from '../task/client.js';
import nameForSubGroup from '../data/subgroup.js';
import nameForEmoji from '../data/namer.js';


const {pathname: dataPath} = new URL('../data/', import.meta.url);

// Index all emoji and create normalized set.
function prepareEmojiModes(all) {
  const normalized = {};
  const variantsIndex = {};
  const modifierBase = new Set();
  for (const data of all) {
    const {emoji, version, description, group, subgroup: subgroupRaw} = data;
    const n = normalize(emoji);

    if (/ skin tone\b/.test(description)) {
      modifierBase.add(n);
      continue;
    }

    const name = nameForEmoji(description);

    variantsIndex[emoji] = {version, name};
    if (emoji !== n) {
      continue;
    }

    const subgroup = nameForSubGroup(subgroupRaw);

    normalized[n] = {
      group,
      subgroup,
      emoji,
      name,
      version,
    };
  }
  modifierBase.forEach((n) => normalized[n].modifier = true);

  return {normalized, variantsIndex};
}


// Load all canonical emoji data together.
function loadDataFiles(...files) {
  const all = [];
  for (const sourceFile of files) {
    const data = fs.readFileSync(path.join(dataPath, sourceFile), 'utf-8');
    all.push(...parser(data));
  }

  return all;
}


const emojiSourceFiles = ['emoji-test.txt', 'emoji-extra-test.txt'];
const all = loadDataFiles(...emojiSourceFiles);

const {normalized, variantsIndex} = prepareEmojiModes(all);
const output = [];

for (const k in normalized) {
  const variantsSource = isRetainedGenderPerson(k) ? {} : genderVariants(k)
  const hasVariants = Object.keys(variantsSource).length !== 0;

  const ev = {};
  for (const variant in variantsSource) {
    const e = variantsSource[variant];
    const {name, version} = variantsIndex[e];
    ev[variant] = {name, version, emoji: e};
  }

  const normalizedData = normalized[k];
  if (hasVariants) {
    Object.assign(normalizedData, {
      variants: ev,
    });
  }

  output.push(normalizedData);
}

console.info(JSON.stringify(output, undefined, 2));
