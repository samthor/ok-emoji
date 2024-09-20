import test from 'node:test';
import * as assert from 'node:assert';
import { dashCase, friendlyCase } from './case.ts';

const expectedFriendlyCase = {
  'Japanese “monthly amount” button': 'Japanese "Monthly Amount" Button',
  dvd: 'DVD',
  'two o’clock': "Two O'Clock",
  'Côte d’Ivoire': "Côte d'Ivoire",
  'flag: Côte d’Ivoire': "Flag: Côte d'Ivoire",
  'Cocos (Keeling) Islands': 'Cocos (Keeling) Islands',
  'flag: Cocos (Keeling) Islands': 'Flag: Cocos (Keeling) Islands',
  'A button (blood type)': 'A Button (Blood Type)',
  'upside-down face': 'Upside-Down Face',
  'woman’s clothes': "Woman's Clothes",
};

test('friendlyCase', () => {
  for (const [source, expected] of Object.entries(expectedFriendlyCase)) {
    assert.strictEqual(friendlyCase(source), expected);
  }
});

const expectedDashCase = {
  'jack-o-lantern': 'jack-o-lantern',
  'ON! arrow': 'on-arrow',
  'keycap: #': 'keycap-hash',
  'Japanese “free of charge” button': 'japanese-free-of-charge-button',
  'flag: Congo - Brazzaville': 'flag-congo-brazzaville',
  'flag: Turks & Caicos Islands': 'flag-turks-caicos-islands',
  'flag: Côte d’Ivoire': 'flag-cote-divoire',
};

test('dashCase', () => {
  for (const [source, expected] of Object.entries(expectedDashCase)) {
    assert.strictEqual(dashCase(source), expected);
  }
});
