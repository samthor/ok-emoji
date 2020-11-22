import {isSingleBase} from '../src/normalize.js';
import {restoreForClient} from '../task/client.js';
import {normalizeForStorage} from '../task/server.js';

/**
 * @param {string} emoji
 * @return {string}
 */
export function normalize(emoji) {
  // This dance gets us the normalized, deexpando'ed emoji to use.
  const emojiServer = normalizeForStorage(emoji);
  if (emojiServer.length !== 1) {
    if (emojiServer.length === 0) {
      // for deprecated emoji
      return emoji;
    }
    throw new Error(`unexpected length, only passing single emoji`);
  }
  const emojiClient = restoreForClient(emojiServer[0]) ?? emojiServer;
  if (emojiClient.length !== 1) {
    throw new Error(`unexpected length, only passing single emoji`);
  }
  return emojiClient[0];
}

/**
 * @param {string} raw
 * @return {boolean}
 */
export function isRetainedGenderPerson(raw) {
  const points = Array.from(raw);
//  console.warn('from', raw, 'to', points);
  if (points.length !== 1) {
    return false;
  }
  return isSingleBase(points[0].codePointAt(0));
}