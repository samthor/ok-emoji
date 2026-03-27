const testCSS =
  `@font-face { /* SIL Open Font License, Version 1.1: https://github.com/adobe-fonts/adobe-blank-2/tree/master */ font-family: AdobeBlank2; src: url('data:font/opentype;base64,T1RUTwAKAIAAAwAgQ0ZGIN6nWacAAAfMAAABMURTSUcAAAABAAAJCAAAAAhPUy8yAF+xmwAAARAAAABgY21hcAE0tLwAAAasAAABAGhlYWQIOsNZAAAArAAAADZoaGVhB1oD7wAAAOQAAAAkaG10eAPoAHwAAAkAAAAACG1heHAAAlAAAAABCAAAAAZuYW1lc0mXUAAAAXAAAAU6cG9zdP+4ADIAAAesAAAAIAABAAAAAgBB1Q6SE18PPPUAAwPoAAAAANKdP6AAAAAA0p0/oAB8/4gDbANwAAAAAwACAAAAAAAAAAEAAANw/4gAAAPoAHwAfANsAAEAAAAAAAAAAAAAAAAAAAACAABQAAACAAAAAwPoAZAABQAAAooCWAAAAEsCigJYAAABXgAyANwAAAAAAAAAAAAAAAD3/67/+9///w/gAD8AAAAAQURCTwBAAAD//wNw/4gAAANwAHhgLwH/AAAAAAAAAAAAAAAgAAAAAAALAIoAAwABBAkAAACUAAAAAwABBAkAAQAaAJQAAwABBAkAAgAOAK4AAwABBAkAAwA4ALwAAwABBAkABAAaAJQAAwABBAkABQB0APQAAwABBAkABgAWAWgAAwABBAkACAA0AX4AAwABBAkACwA0AbIAAwABBAkADQKWAeYAAwABBAkADgA0BHwAQwBvAHAAeQByAGkAZwBoAHQAIACpACAAMgAwADEAMwAsACAAMgAwADEANQAgAEEAZABvAGIAZQAgAFMAeQBzAHQAZQBtAHMAIABJAG4AYwBvAHIAcABvAHIAYQB0AGUAZAAgACgAaAB0AHQAcAA6AC8ALwB3AHcAdwAuAGEAZABvAGIAZQAuAGMAbwBtAC8AKQAuAEEAZABvAGIAZQAgAEIAbABhAG4AawAgADIAUgBlAGcAdQBsAGEAcgAyAC4AMAAwADEAOwBBAEQAQgBPADsAQQBkAG8AYgBlAEIAbABhAG4AawAyADsAQQBEAE8AQgBFAFYAZQByAHMAaQBvAG4AIAAyAC4AMAAwADEAOwBQAFMAIAAyAC4AMAAwADEAOwBoAG8AdABjAG8AbgB2ACAAMQAuADAALgA4ADgAOwBtAGEAawBlAG8AdABmAC4AbABpAGIAMgAuADUALgA2ADUAMAAxADIAQQBkAG8AYgBlAEIAbABhAG4AawAyAEEAZABvAGIAZQAgAFMAeQBzAHQAZQBtAHMAIABJAG4AYwBvAHIAcABvAHIAYQB0AGUAZABoAHQAdABwADoALwAvAHcAdwB3AC4AYQBkAG8AYgBlAC4AYwBvAG0ALwB0AHkAcABlAC8AVABoAGkAcwAgAEYAbwBuAHQAIABTAG8AZgB0AHcAYQByAGUAIABpAHMAIABsAGkAYwBlAG4AcwBlAGQAIAB1AG4AZABlAHIAIAB0AGgAZQAgAFMASQBMACAATwBwAGUAbgAgAEYAbwBuAHQAIABMAGkAYwBlAG4AcwBlACwAIABWAGUAcgBzAGkAbwBuACAAMQAuADEALgAgAFQAaABpAHMAIABGAG8AbgB0ACAAUwBvAGYAdAB3AGEAcgBlACAAaQBzACAAZABpAHMAdAByAGkAYgB1AHQAZQBkACAAbwBuACAAYQBuACAAIgBBAFMAIABJAFMAIgAgAEIAQQBTAEkAUwAsACAAVwBJAFQASABPAFUAVAAgAFcAQQBSAFIAQQBOAFQASQBFAFMAIABPAFIAIABDAE8ATgBEAEkAVABJAE8ATgBTACAATwBGACAAQQBOAFkAIABLAEkATgBEACwAIABlAGkAdABoAGUAcgAgAGUAeABwAHIAZQBzAHMAIABvAHIAIABpAG0AcABsAGkAZQBkAC4AIABTAGUAZQAgAHQAaABlACAAUwBJAEwAIABPAHAAZQBuACAARgBvAG4AdAAgAEwAaQBjAGUAbgBzAGUAIABmAG8AcgAgAHQAaABlACAAcwBwAGUAYwBpAGYAaQBjACAAbABhAG4AZwB1AGEAZwBlACwAIABwAGUAcgBtAGkAcwBzAGkAbwBuAHMAIABhAG4AZAAgAGwAaQBtAGkAdABhAHQAaQBvAG4AcwAgAGcAbwB2AGUAcgBuAGkAbgBnACAAeQBvAHUAcgAgAHUAcwBlACAAbwBmACAAdABoAGkAcwAgAEYAbwBuAHQAIABTAG8AZgB0AHcAYQByAGUALgBoAHQAdABwADoALwAvAHMAYwByAGkAcAB0AHMALgBzAGkAbAAuAG8AcgBnAC8ATwBGAEwAAAAAAAEAAwAKAAAADAANAAAAAAD0AAAAAAAAABMAAAAAAADX/wAAAAEAAOAAAAD9zwAAAAEAAP3wAAD//QAAAAEAAQAAAAH//QAAAAEAAgAAAAL//QAAAAEAAwAAAAP//QAAAAEABAAAAAT//QAAAAEABQAAAAX//QAAAAEABgAAAAb//QAAAAEABwAAAAf//QAAAAEACAAAAAj//QAAAAEACQAAAAn//QAAAAEACgAAAAr//QAAAAEACwAAAAv//QAAAAEADAAAAAz//QAAAAEADQAAAA3//QAAAAEADgAAAA7//QAAAAEADwAAAA///QAAAAEAEAAAABD//QAAAAEAAwAAAAAAAP+1ADIAAAAAAAAAAAAAAAAAAAAAAAAAAAEABAIAAQEBDEFkb2JlQmxhbmsyAAEBAS34G/gciwwe+B0B+B4Ci/sM+gD6BAUeKgAfDB+NDCL3Uw/3WRH3Vgwl96wMJAAFAQEGDlZjcEFkb2JlSWRlbnRpdHlDb3B5cmlnaHQgMjAxMywgMjAxNSBBZG9iZSBTeXN0ZW1zIEluY29ycG9yYXRlZCAoaHR0cDovL3d3dy5hZG9iZS5jb20vKS5BZG9iZSBCbGFuayAyQWRvYmVCbGFuazItMgAAAAABAAAAAAIBAUxO+nz7DLf6JLcB9xC3+Sy3A/cQ+gQV/nz5hPp8B/1Y/icV+dIH98X8MwWmsBX7xfg3Bfj2BqZiFf3SB/vF+DMFcGYV98X8NwX89gYOiw4AAQEBCfgfDCaX97kS+46LHAVGiwa9Cr0LAAAAA+gAfAAAAAAAAAABAAAAAA'); } ` +
  `.ok-emoji-measure { position: absolute; top: 0; contain: content; height: 1em; will-change: transform; } ` +
  `.ok-emoji-measure::after { content: '.' attr(title); font-family: 'Apple Color Emoji', AdobeBlank2; font-variant-emoji: emoji; white-space: nowrap; }`;

const lruCache = /* @__PURE__ */ new Map<string, number>();

/**
 * Builds a browser-based checker that uses a combination of font tricks to work.
 * This can be used as a fallback as at least Chrome does not keep the Unicode group `RGI_Emoji` up-to-date.
 *
 * This is supported in Chrome 131+ and Firefox 141+.
 */
export function buildFontEmojiCheck(): (s: string) => boolean | undefined {
  const s = document.createElement('style');
  s.title = 'ok-emoji';
  s.innerHTML = testCSS;
  document.head.appendChild(s);

  const el = document.createElement('span');
  el.className = 'ok-emoji-measure';

  const measure = (s: string) => {
    const cached = lruCache.get(s);
    if (cached !== undefined) {
      return cached;
    }

    if (!el.parentNode) {
      document.body.append(el);
      Promise.resolve().then(() => el.remove());
    }

    el.title = s;
    const out = el.offsetWidth;

    if (s.length && out) {
      lruCache.set(s, out);

      while (lruCache.size > 100) {
        lruCache.delete(lruCache.keys().next().value!);
      }
    }

    return out;
  };

  return (s: string): boolean | undefined => {
    if (s.length === 0) {
      return true; // zero string is supported?
    } else if (measure('') !== 0) {
      return undefined; // haven't loaded font properly (shouldn't have width)
    }

    const whole = measure(s);
    if (!whole) {
      return false; // zero width: can't render!
    }

    // if emoji is made up of many parts, need to check we're not rendering them
    const runes = Array.from(s);
    if (runes.length <= 1) {
      return true; // only one part and it rendered ok
    }

    // measure all individual valid runes
    // we assume rendering is OK if whole is <=4/3 of average rune size

    let total = 0;
    let valid = 0;
    for (const each of runes) {
      const m = measure(each);
      if (m) {
        total += m;
        ++valid;
      }
    }

    const avg = total / valid;
    const ok = whole * 3 <= avg * 4;
    return ok;
  };
}
