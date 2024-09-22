#!/usr/bin/env node --experimental-strip-types

import { decodeClassifyOut } from './src/encoding/decode.ts';
import { encodeClassifyOut } from './src/encoding/encode.ts';
import { iterateEmojiTest } from './src/parser.ts';
import * as fs from 'node:fs';
import * as zlib from 'node:zlib';

const it = iterateEmojiTest(fs.readFileSync('emoji-test.txt', 'utf-8'));
const e = encodeClassifyOut([...it]);

//console.warn(JSON.stringify(e.order, null, 2));

const groups = e.byKey;

const minOut = JSON.stringify(groups);
const size = new TextEncoder().encode(minOut).length;

const gz = zlib.gzipSync(minOut);
console.warn('size', size, 'gzipSize', gz.length);

//console.info(JSON.stringify(groups, null, 2));

const out = decodeClassifyOut(e.byKey);
console.warn('got decoded', JSON.stringify(out, null, 2));

console.info(out.length); // ~2000
