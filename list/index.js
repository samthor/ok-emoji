#!/usr/bin/env node

/**
 * @fileoverview Generates a list of ungendered emoji.
 */

import fs from 'fs';
import path from 'path';
import YAML from 'yaml';

import {Corpus} from './corpus.js';
import {parser} from '../gen/parser.js';
import {isRetainedGenderPerson, normalize} from './normalize.js';
import {genderVariants} from '../task/client.js';


const {pathname: dataPath} = new URL('../data/', import.meta.url);


// Index all emoji and create normalized set.
function prepareEmojiModes(all) {
  const normalized = {};
  const variantsIndex = {};
  const modifierBase = new Set();
  for (const data of all) {
    const {emoji, version, description, group, subgroup} = data;
    const n = normalize(emoji);

    if (/ skin tone\b/.test(description)) {
      modifierBase.add(n);
      continue;
    }

    if (emoji !== n) {
      variantsIndex[emoji] = {version, description};
      continue;
    }

    normalized[n] = {
      modifier: false,
      group,
      subgroup,
      emoji,
      description,
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
const corpus = new Corpus();

const extraNames = YAML.parse(fs.readFileSync(path.join(dataPath, 'names.yaml'), 'utf-8'));
// for (const k in extraNames) {
//   const n = normalize(k);
//   if (n !== k) {
//     extraNames[n] = (extraNames[n] || []).concat(extraNames[k]);
//     delete extraNames[k];
//   }
// }

for (const k in normalized) {
  const variantsSource = isRetainedGenderPerson(k) ? {} : genderVariants(k)
  const hasVariants = Object.keys(variantsSource).length !== 0;

  const ev = {};
  delete variantsSource.n;
  for (const variant in variantsSource) {
    const e = variantsSource[variant];
    const {description, version} = variantsIndex[e];
    ev[variant] = {description, version, emoji: e};
  }

  const normalizedData = normalized[k];
  const {description} = normalizedData;
  if (hasVariants) {
    Object.assign(normalizedData, {
      variants: ev,
    });
  }

  if (!corpus.add(description, normalizedData)) {
    throw new Error(`got duplicate page: ${description}`);
  }

  // Try listed extra names.
  (extraNames[k] || []).forEach((name) => {
    if (!corpus.link(description, name)) {
      throw new Error(`got duplicate link: ${name}`);
    }
  });
  delete extraNames[k];

  // Try a few optional extra names. Don't be so strict about this.
  if (description.startsWith('flag: ')) {
    corpus.link(description, description.substr('flag: '.length));
  } else {
    corpus.link(description, description.replace(/\s+/g, ''));
  }
}

const remainingExtraNames = Object.keys(extraNames).length;
if (remainingExtraNames) {
  throw new Error(`had ${remainingExtraNames} extraNames`);
}

console.info(JSON.stringify(corpus.all(), undefined, 2));
