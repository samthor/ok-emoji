#!/usr/bin/env node --experimental-strip-types

import { friendlyCase } from './src/case.ts';
import { classifyAllEmoji } from './src/classify.ts';
import { decodeAllEmojiData } from './src/encoding/decode.ts';
import { buildAllEmojiData, encodeAllEmojiData } from './src/encoding/encode.ts';
import { iterateEmojiTest } from './src/parser.ts';
import * as fs from 'node:fs';
import * as zlib from 'node:zlib';

const it = iterateEmojiTest(fs.readFileSync('emoji-test.txt', 'utf-8'));
const c = classifyAllEmoji(it);
const all = buildAllEmojiData(c);
const enc = encodeAllEmojiData(all);

console.info(JSON.stringify(enc, null, 2));

const dec = decodeAllEmojiData(enc);

//console.warn(JSON.stringify(e.order, null, 2));

const minOut = JSON.stringify(enc);
const size = new TextEncoder().encode(minOut).length;

const gz = zlib.gzipSync(minOut);
console.warn('size', size, 'gzipSize', gz.length);

//console.info(JSON.stringify(groups, null, 2));
