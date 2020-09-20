/**
 * @fileoverview Enhances the raw definitions with version information.
 */

// NOTES:
//   E12.1 only added neuter fix for professions, plus broken "people holding hands" stuff
//   E13.1 added some ZWJs, beard gender, and skin tones for people groups

import {
  professions as professionsSource,
  roles as rolesSource,
} from './raw/defs.js';
import {jsdecode} from './string.js';
import * as helper from './helper.js';

const professionsSet = new Set(Array.from(jsdecode(professionsSource)));
const rolesSet = new Set(Array.from(jsdecode(rolesSource)));

/**
 * This is override source data for professions and roles across versions. This maps runes to their
 * config.
 *
 * Each config can have three properties:
 *   - f: emoji introduced from
 *   - g: gender introduced from
 *   - n: neuter introduced from
 *
 * If `f` is not specified, this is assumed to be before E11. If `g` or `n` are not specified, they
 * take the value of `f`.
 */
const configSource = [
  {g: 120}, [0x1f9cd, 0x1f9ce, 0x1f9cf, 0x1f9af, 0x1f9bc, 0x1f9bd],  // a11y emoji
  {g: 130}, [0x1f470, 0x1f935],  // wedding emoji
  {f: 110}, [0x1f9b8, 0x1f9b9],  // superhero/villan
  {f: 110, n: 121}, [0x1f9b0, 0x1f9b1, 0x1f9b2, 0x1f9b3],  // hair
  {f: 130}, [0x1f37c],  // feeding baby
  {g: 131}, [0x1f935],  // beard
  {n: 140}, [helper.runeCrown, helper.runeMusicalNotes],  // future emoji
  {n: 130}, [helper.runeHolidayTree],  // claus
];

function updateConfig(config) {
  const version = config['f'] || 0;  // default to zero
  config['g'] = config['g'] || version;
  config['n'] = config['n'] || version;
  return config;
}

const defaultRoleConfig = updateConfig({});
const defaultProfessionConfig = updateConfig({n: 121});

const unicodeConfig = new Map();
for (let i = 0; i < configSource.length; i += 2) {
  const config = updateConfig(configSource[i+0]);
  const each = configSource[i+1];
  each.forEach((point) => unicodeConfig.set(point, config));
}


/**
 * @param {number} base
 * @return {?{f: number, g: number, n: version}}
 */
export function getPersonConfig(base) {
  const config = unicodeConfig.get(base);
  if (config !== undefined) {
    return config;
  }
  if (professionsSet.has(base)) {
    return defaultProfessionConfig;
  }
  if (rolesSet.has(base)) {
    return defaultRoleConfig;
  }
  return null;
}


/**
 * @param {number} base
 * @return {boolean}
 */
export function isProfession(base) {
  return professionsSet.has(base);
}


/**
 * @param {number} base
 * @return {boolean}
 */
export function isRole(base) {
  return rolesSet.has(base)
}
