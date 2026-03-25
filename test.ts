#!/usr/bin/env node --experimental-strip-types
/**
 * @fileoverview Generates classified/encoded emoji data.
 */

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

// log the encoded data (we can use this in a pipe)
console.info(JSON.stringify(enc, null, 2));

// call to confirm we don't throw
decodeAllEmojiData(enc);

// announce the actual JSON and gzipped size of the emoji classification data
const minOut = JSON.stringify(enc);
const size = new TextEncoder().encode(minOut).length;
const gz = zlib.gzipSync(minOut);
console.warn('size', size, 'gzipSize', gz.length);
