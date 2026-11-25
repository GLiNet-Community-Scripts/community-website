// Brings the "reported" table of an advisory up to date in the reader's browser. The page
// is built at most once a day, the live list changes within a quarter of an hour. The
// element with data-reported-live names the worker's live.json and carries the list kept
// by hand; the table is drawn again from both. Without an answer, or with one that does
// not look right, the table from the build stays as it is.
import { byVer, laterOf, mergeReported, parseLive, pluralKind, repGroups, series, type RepModel } from '../lib/reported';
import { when } from '../lib/format';
import { liveJson } from './live-json';

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text = '') => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
};

function table(g: ReturnType<typeof repGroups>[number]): HTMLElement {
  const wrap = el('div', 'sa-table-wrap rep-wrap'), t = el('table', 'rep-table');
  const cap = el('caption', '', pluralKind(g.kind) + ' ');
  cap.append(el('span', '', `${g.models.length} ${g.models.length === 1 ? 'model' : 'models'}`));
  const head = el('tr');
  head.append(el('th', '', 'Model'), ...g.cols.map((c) => el('th', 'v', c)));
  const thead = el('thead'), tbody = el('tbody');
  thead.append(head);
  for (const m of g.models) {
    const tr = el('tr'), th = el('th');
    th.scope = 'row';
    th.append(el('b', '', m.name));
    if (m.sku && m.sku !== m.name) th.append(el('small', '', m.sku));
    tr.append(th);
    if (m.firmware.length === 0) {
      const td = el('td', 'unknown', 'Traces reported, firmware not known');
      td.colSpan = g.cols.length;
      tr.append(td);
    } else {
      for (const c of g.cols) {
        const vs = m.firmware.filter((v) => series(v) === c).sort(byVer), td = el('td', vs.length ? 'c' : 'c none');
        td.append(...vs.map((v) => el('span', 'ver', v)));
        tr.append(td);
      }
    }
    tbody.append(tr);
  }
  t.append(cap, thead, tbody);
  wrap.append(t);
  return wrap;
}

for (const box of document.querySelectorAll<HTMLElement>('[data-reported-live]')) {
  const src = box.dataset.reportedLive, tables = box.querySelector<HTMLElement>('[data-reported-tables]');
  if (!src || !tables) continue;
  let own: RepModel[], asOf: string;
  try {
    own = JSON.parse(box.dataset.reportedOwn || '');
    asOf = box.dataset.reportedAsOf || '';
  } catch {
    continue;
  }
  liveJson(src).then((j) => {
    const live = parseLive(j !== null && typeof j === 'object' ? (j as { reported?: unknown }).reported : null);
    if (!live) return;
    const models = mergeReported(own, live);
    tables.replaceChildren(...repGroups(models).map(table));
    const at = box.querySelector('[data-reported-as-of]'), n = box.querySelector('[data-reported-count]');
    if (at) at.textContent = `As of ${when(laterOf(asOf, live))}`;
    if (n) n.textContent = `${models.length} models`;
  });
}
