// Shows which version of a script is served right now and how long ago it came out. The
// build writes both into the page (components/ScriptVersion.astro); an element with
// data-version-src names the worker's live.json, and the answer brings them up to date.
// Without an answer, or with one of an odd shape, the page keeps what the build wrote.
// Only text is set, never markup.
import { parseScriptVersion } from '../lib/script-version';
import { liveJson } from './live-json';

function ago(at: Date): string {
  const min = Math.round((Date.now() - at.getTime()) / 60000);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  if (min >= 2880) return rtf.format(-Math.round(min / 1440), 'day');
  if (min >= 90) return rtf.format(-Math.round(min / 60), 'hour');
  if (min >= 1) return rtf.format(-min, 'minute');
  return 'just now';
}

function released(box: HTMLElement, iso: string) {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return;
  for (const el of box.querySelectorAll<HTMLElement>('[data-script-released]')) {
    el.textContent = `released ${ago(at)} (${iso.slice(0, 16).replace('T', ' ')} UTC)`;
    el.hidden = false;
  }
}

for (const box of document.querySelectorAll<HTMLElement>('[data-version-src]')) {
  const built = box.querySelector<HTMLElement>('[data-script-released][data-at]');
  if (built) released(box, built.dataset.at!);
  const src = box.dataset.versionSrc;
  if (!src) continue;
  liveJson(src).then((j) => {
    const v = parseScriptVersion(j);
    if (!v) return;
    for (const el of box.querySelectorAll('[data-script-version]')) el.textContent = v.version;
    if (v.released) released(box, v.released);
  });
}
