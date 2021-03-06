[![Build Status](https://travis-ci.org/samthor/ok-emoji.svg?branch=master)](https://travis-ci.org/samthor/ok-emoji)

Provides JavaScript helpers for working with emoji.

This includes code to swap or modify gender, and adjust the skin tone of emoji.
There's also some browser-only code to guess whether an emoji is supported on your user's platform.
It's browser-only as it requires `HTMLCanvasElement` or `OffscreenCanvas`.

Updated for [Unicode 13.0](https://www.unicode.org/Public/emoji/13.0/).
Generation code for "defs.js" is in Go at [tr51/datagen](https://github.com/samthor/tr51/tree/master/datagen).

## Usage

TODO

## Emoji Revisions

Every emoji release add a number of new basic emoji.
However, many releases have tweaked or update the rules for emoji, typically w.r.t. combined emoji and gender.

### 2019 (E12)

Emoji 12.1 added nearly all missing gender neutral professions.
Previously, professions were only created by "MAN/WOMAN + ZWJ + ROLE", e.g. "MAN + ZWJ + MICROPHONE" for "MAN SINGER", but 12.1 allows "PERSON + ZWJ + ROLE".

Additionally, across 12.0 and 12.1, support was added for skin tones for the "WOMAN AND MAN HOLDING HANDS" and related emoji.
This allows different skin tones for both people in the emoji.

### 2020 (E13)

Emoji 13 made minor but interesting changes:

* Added a gender neutral "MX CLAUS" to go with "SANTA CLAUS" and "MRS CLAUS".
  This gender neutral version is made up of "PERSON + ZWJ + HOLIDAY TREE", but the gendered versions still have a single old-style code point each.
  (ok-emoji can expando this to the "MAN/WOMAN + ZWJ + HOLIDAY TREE" for manipulation.)

* It repurposed two old gendered emoji to create neutral "PERSON IN TUXEDO" and "PERSON IN VEIL", with new role variants ("MALE/FEMALE" roles).

* It added gendered emoji for "PERSON: BEARD"

### 2021+ (E14?)

We assume two upcoming changes that are likely to occur in future emoji versions:

* "PRINCESS" and "PRINCE" are assumed to be a gender neutral version of "PERSON WITH CROWN"
* "WOMAN DANCING" and "MAN DANCING" are assumed to be a gender neutral version of "PERSON WITH MUSICAL NOTES"

These are the last two remaining emoji with F/M pairs that do not have a gender neutral equivalent.
("CROWN" is listed in [a Unicode proposal](https://www.unicode.org/L2/L2020/20189r-person-wearing-crown.pdf), "MUSICAL NOTES" [is less clear](https://www.unicode.org/L2/L2020/20196-gender-skintone-update.pdf).)

There also exists "PREGNANT WOMAN" which is specifically gendered.
A future [recommendation](https://www.unicode.org/L2/L2020/20242r2-emoji-recs-14.pdf) suggests adding "PERSON WITH SWOLLEN BELLY", but ok-emoji does not address this (the singular "PREGNANT WOMAN" is not seen as gendered since there's no other versions).
