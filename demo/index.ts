import { supportsSingleEmoji } from '../src/support.ts';
import { buildFontEmojiCheck } from '../src/support-font.ts';

const tests = [
  { emoji: '🫪', support: true },
  { emoji: '', support: false },
  { emoji: '🐱‍💻', support: false },
  { emoji: '🧑🏽‍🐰‍🧑🏾', support: true },
  { emoji: '👩🏽‍🦽‍➡️', support: true },
  { emoji: '🇨🇶', support: true },
  { emoji: '🇦🇦', support: false },
];
const fc = buildFontEmojiCheck();

for (;;) {
  let anyUndefined = false;

  for (const t of tests) {
    const res = supportsSingleEmoji(t.emoji);
    const resFallback = fc(t.emoji);

    const div = document.createElement('div');
    div.textContent = `${t.emoji} => ${res},${resFallback}`;
    document.body.appendChild(div);

    if (res === undefined || resFallback === undefined) {
      anyUndefined = true;
      continue;
    }

    if (res !== t.support || resFallback !== t.support) {
      div.style.color = 'red';
      throw new Error(`expected ${t.emoji}: ${t.support}`);
    }
  }

  if (!anyUndefined) {
    break;
  }
  await new Promise((r) => window.requestAnimationFrame(r));
}
