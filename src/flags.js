/**
 * @fileoverview Exports a set containing all standardized country flags, made up of regional
 * indicators text (i.e., emoji A-Z).
 */

import {flags as source} from './raw/defs.js';
import {runeFlagA} from './helper.js';

/**
 * @param {string} source flags in "aaabac" form
 * @return {!Set<string>} set of valid flags made up of regional indicators
 */
function buildSet(source) {
  const all = new Set();
  const mod = -97 + runeFlagA;  // ASCII 'a' is 97
 
  for (let i = 0; i < source.length; i += 2) {
    // convert a-z to actual Regional Indicator symbols
    const s = String.fromCodePoint((source.charCodeAt(i) + mod), (source.charCodeAt(i + 1) + mod));
    all.add(s);
  }

  return all;
}

/**
 * @type {!Set<string>}
 */
export default buildSet(source);
