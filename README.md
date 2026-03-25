JavaScript helpers for working with emoji.

This package requires `\p{RGI_Emoji}` support, which is provided in [Unicode character sets](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/unicodeSets).
This has been supported everywhere since September 2023, and as of March 2026, has 91.5%+ support.
(Chrome <=111 is the biggest cohort without support.)

## Dependencies

This embeds [adobe-blank-2](https://github.com/adobe-fonts/adobe-blank-2) used under the SIL Open Font License, Version 1.1.

We use this as part of a fallback for Chrome which apparently does not keep `RGI_Emoji` up-to-date.
