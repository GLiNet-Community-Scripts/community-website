// Shows which version of a script is served right now and how long ago it came out.
// An element with data-version-src names the script's address; inside it,
// [data-script-version] takes the version and [data-script-released] the age. Both are
// read from the script itself (its VERSION= and RELEASED= lines). Without an answer the
// fallback text in the page stays.
function ago(at: Date): string {
  const min = Math.round((Date.now() - at.getTime()) / 60000);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  if (min >= 2880) return rtf.format(-Math.round(min / 1440), 'day');
  if (min >= 90) return rtf.format(-Math.round(min / 60), 'hour');
  if (min >= 1) return rtf.format(-min, 'minute');
  return 'just now';
}

const texts = new Map<string, Promise<string>>();
for (const box of document.querySelectorAll<HTMLElement>('[data-version-src]')) {
  const src = box.dataset.versionSrc;
  if (!src) continue;
  if (!texts.has(src)) texts.set(src, fetch(src).then((r) => (r.ok ? r.text() : '')).catch(() => ''));
  texts.get(src)!.then((t) => {
    const m = /^VERSION=([0-9.]+)$/m.exec(t);
    if (!m) return;
    for (const el of box.querySelectorAll('[data-script-version]')) el.textContent = m[1];
    const d = /^RELEASED='(\d{4}-\d\d-\d\d) (\d\d:\d\d) UTC'$/m.exec(t);
    const at = d ? new Date(`${d[1]}T${d[2]}:00Z`) : null;
    if (!d || !at || Number.isNaN(at.getTime())) return;
    for (const el of box.querySelectorAll<HTMLElement>('[data-script-released]')) {
      el.textContent = `released ${ago(at)} (${d[1]} ${d[2]} UTC)`;
      el.hidden = false;
    }
  });
}
