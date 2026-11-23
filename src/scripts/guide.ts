// What reacts to a click or to typing on the guide pages (the guide of an advisory and the
// guide of the community script): choices of two or three, the timeline's filters, the
// topics of "What we know", the search in the table of models, folded lists, copy buttons.
const $$ = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document) => [...root.querySelectorAll<T>(sel)];

const pick = { who: '', tz: 'utc', order: 'new', q: '' };

// the timeline: who, which clock, which order, and a search
function timeline() {
  const list = document.querySelector<HTMLElement>('.g-list');
  if (!list) return;
  list.classList.toggle('old', pick.order === 'old');
  let shown = 0;
  for (const day of $$('.g-day', list)) {
    let any = false;
    for (const ev of $$('.g-ev', day)) {
      const ok = (!pick.who || ev.dataset.who === pick.who) && (!pick.q || (ev.textContent ?? '').toLowerCase().includes(pick.q));
      ev.hidden = !ok;
      if (ok) { any = true; shown++; }
      const at = ev.dataset.at ?? '', t = ev.querySelector('time');
      if (t && at.length > 10) t.textContent = pick.tz === 'utc' ? at.slice(11, 16) : new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    day.hidden = !any;
  }
  const none = document.querySelector<HTMLElement>('.g-none');
  if (none) none.hidden = shown > 0;
}

// every choice of two or three: mark the button, then do what it stands for
for (const seg of $$('.g-seg')) {
  seg.addEventListener('click', (ev) => {
    const b = (ev.target as HTMLElement).closest<HTMLElement>('button');
    if (!b) return;
    $$('button', seg).forEach((x) => x.classList.toggle('on', x === b));
    const kind = seg.dataset.seg ?? '', v = b.dataset.v ?? '';
    if (kind === 'steps') $$('.g-steps[data-kind]').forEach((l) => (l.hidden = l.dataset.kind !== v));
    if (kind === 'after') $$('[data-after]').forEach((l) => (l.hidden = l.dataset.after !== v));
    // curl or wget: for every command on the page that has both
    if (kind === 'dl') {
      $$('.g-cmd[data-dl]').forEach((l) => (l.hidden = l.dataset.dl !== v));
      $$('.g-seg[data-seg="dl"] button').forEach((x) => x.classList.toggle('on', x.dataset.v === v));
    }
    if (kind === 'who' || kind === 'tz' || kind === 'order') { pick[kind] = v; timeline(); }
  });
}
for (const i of $$<HTMLInputElement>('.g-search')) i.addEventListener('input', () => { pick.q = i.value.trim().toLowerCase(); timeline(); });

// a dot in the chart leads to its entry, whatever the filter hides
for (const a of $$('.g-chart a')) {
  a.addEventListener('click', () => {
    const ev = document.querySelector<HTMLElement>(a.getAttribute('href') ?? '');
    if (!ev || !ev.hidden) return;
    pick.who = '';
    pick.q = '';
    $$('.g-seg[data-seg="who"] button').forEach((x, n) => x.classList.toggle('on', n === 0));
    $$<HTMLInputElement>('.g-search').forEach((s) => (s.value = ''));
    timeline();
  });
}

// "What we know": one topic at a time
for (const nav of $$('.g-md-nav')) {
  nav.addEventListener('click', (ev) => {
    const b = (ev.target as HTMLElement).closest<HTMLElement>('button');
    if (!b) return;
    $$('button', nav).forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', String(x === b)); });
    $$('.g-topic', nav.parentNode!).forEach((t) => (t.hidden = t.dataset.i !== b.dataset.i));
  });
}

// the table of models: show the rows that match. The table is drawn again when the live
// list arrives, so the filter is applied again then.
for (const i of $$<HTMLInputElement>('.g-find input')) {
  const box = i.closest('[data-reported-live]') ?? document, tables = box.querySelector('[data-reported-tables]');
  const apply = () => {
    const q = i.value.trim().toLowerCase();
    $$('.g-scroll tbody tr', box).forEach((tr) => (tr.hidden = q !== '' && !(tr.textContent ?? '').toLowerCase().includes(q)));
  };
  i.addEventListener('input', apply);
  if (tables) new MutationObserver(apply).observe(tables, { childList: true });
}

// "show all": the timeline without its box, the sources with their notes
for (const m of $$('.g-more')) m.addEventListener('click', () => { $$('.g-' + m.dataset.more).forEach((x) => x.classList.add('all')); m.hidden = true; });

for (const b of $$('[data-copy-cmd]')) {
  b.addEventListener('click', () => {
    const code = b.parentElement?.querySelector('code');
    if (!code) return;
    const done = () => { b.textContent = 'Copied'; setTimeout(() => (b.textContent = 'Copy'), 1500); };
    const select = () => { const r = document.createRange(); r.selectNodeContents(code); const s = getSelection(); s?.removeAllRanges(); s?.addRange(r); };
    if (navigator.clipboard) navigator.clipboard.writeText(code.textContent ?? '').then(done, select);
    else select();
  });
}

// a link to a section whose content is folded away opens it
const unfold = (hash: string) => {
  const t = hash.length > 1 ? document.getElementById(hash.slice(1)) : null;
  const d = t?.matches('section') ? t.querySelector<HTMLDetailsElement>(':scope > details.g-fold:only-of-type') : null;
  if (d) d.open = true;
};
addEventListener('click', (ev) => {
  // also a link inside the chart, which has no "hash" of its own
  const a = (ev.target as Element).closest('a[href^="#"]');
  if (a) unfold(a.getAttribute('href') ?? '');
});
unfold(location.hash);
