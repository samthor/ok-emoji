Finds whether an emoji is supported in the browser.
This package doesn't contain or know the [canonical list of emoji](https://www.unicode.org/Public/emoji/11.0/emoji-test.txt): it uses the browser to measure whether emoji render properly.

This can be useful to control whether to render certain emoji at all, or perhaps show a replacement image.
Used on [Emojityper](https://emojityper.com) and [emojibuff](https://emojibuff.com).

Runs only in the browser, as it uses the DOM and `<canvas>` to do its work.

## Usage

```js

import isExpectedLength from './node_modules/is-emoji/index.js';
console.info('is this emoji valid on this browser?', isExpectedLength('👨‍👩‍👧‍👦'));

```
