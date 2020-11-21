#!/usr/bin/env node

/**
 * @fileoverview Generates a list of ungendered emoji.
 */

import fs from 'fs';
import slugify from 'slugify';

import {parser} from './gen/parser.js';
import { genderVariants, restoreForClient } from './task/client.js';
import {normalizeForStorage} from './task/server.js';

const data = fs.readFileSync('emoji-test.txt', 'utf-8');
const all = parser(data);

// These will (probably) be added in Unicode 14.0, but don't exist in the source data now.
const overrides = {
  '🧑‍👑': 'Royalty',
  '🧑‍🎶': 'Dancer',
};

const emojiIndex = {};
const normalized = new Set();

for (const {emoji, version, description} of all) {
  if (/ skin tone\b/.test(description)) {
    // TODO: set bit
    continue;
  }
  emojiIndex[emoji] = {version, description};

  // This dance gets us the normalized, deexpando'ed emoji to use.
  const emojiServer = normalizeForStorage(emoji);
  if (emojiServer.length !== 1) {
    throw new Error(`unexpected length, only passing single emoji`);
  }
  const emojiClient = restoreForClient(emojiServer[0]) ?? emojiServer;
  if (emojiClient.length !== 1) {
    throw new Error(`unexpected length, only passing single emoji`);
  }
  normalized.add(emojiClient[0]);
}

const pageIndex = {};
const insertPage = (description, version, emoji, ev) => {
  // TODO: keycaps need custom names
  const page = slugify(description, {
    lower: true,
    strict: true,
  });
  if (!page || page in pageIndex) {
    throw new Error(`got dup page: ${page}`);
  }
  pageIndex[page] = {description, version, emoji};

  if (Object.keys(ev).length) {
    pageIndex[page].variants = ev;
  }
};

for (const k of normalized) {
  const variants = genderVariants(k);
  let {description, version} = emojiIndex[k] ?? {};
  if (description === undefined) {
    description = overrides[k];
    version = -1.0;  // we inferred this
  }
  if (!description) {
    throw new Error(`missing description: ${k}`);
  }

  // TODO: this is a bit ugly (share code instead?), *and* gives us e.g. child/boy/girl for all
  // cases (we don't collapse these)
  const ev = {};
  for (const variant in variants) {
    if (variant === 'n') {
      continue;
    }
    const e = variants[variant];
    const {description, version} = emojiIndex[e];
    ev[variant] = {description, version, emoji: e};
  }

  insertPage(description, version, k, ev);
}

console.info(JSON.stringify(pageIndex, undefined, 2));