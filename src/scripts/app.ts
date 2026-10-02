/*
 * Client side: search, category filter, sorting, the detail and install
 * sheets, copy buttons and relative dates. All markup is rendered at build
 * time; this script only shows, hides, reorders and clones it.
 */
import { ago } from '../lib/format';

type Sort = 'stars' | 'updated' | 'name';
const state: { cat: string; q: string; sort: Sort } = { cat: 'all', q: '', sort: 'stars' };

const $ = <T extends HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel)!;
const catalog = $('#catalog');
const results = $('#results');
const resultsGrid = $('.grid', results);
const cards = [...catalog.querySelectorAll<HTMLElement>('.card')];
const chips = $('#chips');
const q = $<HTMLInputElement>('#q');
const sheet = $<HTMLDialogElement>('#sheet');

// ── relative dates ───────────────────────────────────────────
function refreshDates(root: ParentNode = document) {
  for (const el of root.querySelectorAll<HTMLElement>('[data-ago]')) el.textContent = ago(el.dataset.ago!);
}

// ── filtering and sorting ────────────────────────────────────
const sorters: Record<Sort, (a: HTMLElement, b: HTMLElement) => number> = {
  stars: (a, b) => Number(b.dataset.stars) - Number(a.dataset.stars) || a.dataset.name!.localeCompare(b.dataset.name!),
  updated: (a, b) => Date.parse(b.dataset.updated || '0') - Date.parse(a.dataset.updated || '0'),
  name: (a, b) => a.dataset.name!.localeCompare(b.dataset.name!),
};

// "flint 2" stays one term: a bare number belongs to the word before it.
function terms(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .reduce<string[]>((acc, w) => {
      if (/^\d+$/.test(w) && acc.length) acc.push(`${acc.pop()} ${w}`);
      else acc.push(w);
      return acc;
    }, []);
}

function render() {
  const t = terms(state.q);
  if (!t.length && state.cat === 'all') {
    for (const grid of catalog.querySelectorAll<HTMLElement>('.section .grid')) {
      grid.append(...[...grid.querySelectorAll<HTMLElement>(':scope > .card')].sort(sorters[state.sort]));
    }
    catalog.hidden = false;
    results.hidden = true;
    return;
  }
  const matches = cards
    .filter((c) => (state.cat === 'all' || c.dataset.cat === state.cat) && t.every((w) => c.dataset.search!.includes(w)))
    .sort(sorters[state.sort]);
  const chip = chips.querySelector<HTMLElement>(`[data-cat="${state.cat}"]`);
  $('#results-title').textContent = state.q ? `Results for “${state.q}”` : chip?.dataset.title ?? 'Results';
  $('#results-count').textContent = `${matches.length} app${matches.length === 1 ? '' : 's'}`;
  const intro = $('#results-intro');
  intro.textContent = !state.q && chip?.dataset.intro ? chip.dataset.intro : '';
  intro.hidden = !intro.textContent;
  resultsGrid.replaceChildren(...matches.map((c) => c.cloneNode(true)));
  $('.empty', results).hidden = matches.length > 0;
  catalog.hidden = true;
  results.hidden = false;
}

chips.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-cat]');
  if (!btn) return;
  state.cat = btn.dataset.cat!;
  for (const b of chips.children) b.setAttribute('aria-pressed', String(b === btn));
  render();
  $('#browse').scrollIntoView({ block: 'start' });
});

let timer: number | undefined;
q.addEventListener('input', () => {
  clearTimeout(timer);
  timer = window.setTimeout(() => {
    state.q = q.value.trim();
    render();
  }, 120);
});

$('#suggest').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest('button');
  if (!b) return;
  q.value = state.q = b.textContent!.trim();
  render();
  $('#browse').scrollIntoView({ block: 'start' });
});

$<HTMLSelectElement>('#sort').addEventListener('change', (e) => {
  state.sort = (e.target as HTMLSelectElement).value as Sort;
  render();
});

document.addEventListener('keydown', (e) => {
  if (e.key === '/' && document.activeElement !== q && !sheet.open) {
    e.preventDefault();
    q.focus();
  }
});

// ── sheets ───────────────────────────────────────────────────
function setHash(hash: string) {
  history.replaceState(null, '', hash || location.pathname + location.search);
}

function openApp(id: string, view: 'details' | 'install', push = true): boolean {
  const tpl = document.getElementById(`tpl-${view}-${id}`) as HTMLTemplateElement | null;
  if (!tpl) return false;
  sheet.replaceChildren(tpl.content.cloneNode(true));
  const title = sheet.querySelector('.sheet-title');
  if (title) title.id = 'sheet-title';
  refreshDates(sheet);
  if (!sheet.open) sheet.showModal();
  sheet.querySelector<HTMLElement>('.sheet')?.focus();
  sheet.scrollTop = 0;
  if (push) setHash(view === 'install' ? `#install-${id}` : `#${id}`);
  return true;
}

function openFromHash() {
  const hash = decodeURIComponent(location.hash.slice(1));
  if (!hash) return;
  if (hash.startsWith('install-') && openApp(hash.slice(8), 'install', false)) return;
  openApp(hash, 'details', false);
}

sheet.addEventListener('close', () => setHash(''));
sheet.addEventListener('click', (e) => {
  if (e.target === sheet || (e.target as HTMLElement).closest('[data-close]')) sheet.close();
});

// ── clicks: open sheets (links stay real links for new tabs), copy ──
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  const plain = e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
  const installer = target.closest<HTMLElement>('[data-install]');
  const opener = target.closest<HTMLElement>('[data-open]');
  if (plain && (installer || opener)) {
    e.preventDefault();
    if (installer) openApp(installer.dataset.install!, 'install');
    else openApp(opener!.dataset.open!, 'details');
    return;
  }
  const copy = target.closest<HTMLButtonElement>('[data-copy]');
  if (!copy) return;
  const label = copy.querySelector('span');
  const done = () => {
    if (!label) return;
    label.textContent = 'Copied';
    setTimeout(() => (label.textContent = 'Copy'), 1600);
  };
  const selectInstead = () => {
    const code = copy.closest('.term')?.querySelector('code');
    if (!code) return;
    const range = document.createRange();
    range.selectNodeContents(code);
    const sel = getSelection()!;
    sel.removeAllRanges();
    sel.addRange(range);
  };
  navigator.clipboard?.writeText(copy.dataset.copy!).then(done, selectInstead) ?? selectInstead();
});

window.addEventListener('hashchange', openFromHash);
refreshDates();
openFromHash();
