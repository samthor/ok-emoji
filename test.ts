#!/usr/bin/env node --experimental-strip-types

import { classifyAllEmoji } from './src/classify.ts';
import { iterateEmojiTest } from './src/parser.ts';
import * as fs from 'node:fs';

const it = iterateEmojiTest(fs.readFileSync('emoji-test.txt', 'utf-8'));

classifyAllEmoji([...it]);
