/* Security pages: archive filters and copy buttons. */
import { copyFrom } from './copy';

const archive = document.getElementById('sa-archive');
if (archive) {
  const rows = [...archive.querySelectorAll<HTMLElement>('li[data-status]')];
  const chips = document.querySelector<HTMLElement>('.sa-filters .chips')!;
  const model = document.querySelector<HTMLSelectElement>('#sa-model');
  let status = 'all';

  const update = () => {
    let shown = 0;
    for (const li of rows) {
      const ok =
        (status === 'all' || li.dataset.status === status) &&
        (!model?.value || li.dataset.models!.split(' ').includes(model.value));
      li.hidden = !ok;
      if (ok) shown++;
    }
    for (const list of archive.querySelectorAll<HTMLElement>('.sa-list')) {
      const any = [...list.children].some((li) => !(li as HTMLElement).hidden);
      list.hidden = !any;
      archive.querySelector<HTMLElement>(`.sa-year[data-year="${list.dataset.year}"]`)!.hidden = !any;
    }
    document.getElementById('sa-empty')!.hidden = shown > 0;
    document.getElementById('sa-count')!.textContent = `${shown} advisor${shown === 1 ? 'y' : 'ies'}`;
  };

  chips.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-f]');
    if (!b) return;
    status = b.dataset.f!;
    for (const x of chips.children) x.setAttribute('aria-pressed', String(x === b));
    update();
  });
  model?.addEventListener('change', update);
}

// Terminal blocks that offer the same step with several tools (curl, wget): switching one
// switches all of them, and the choice is remembered in this browser.
function useVariant(name: string) {
  for (const term of document.querySelectorAll<HTMLElement>('.term')) {
    const pre = term.querySelector<HTMLElement>(`pre[data-variant="${CSS.escape(name)}"]`);
    if (!pre) continue;
    for (const p of term.querySelectorAll<HTMLElement>('pre[data-variant]')) p.hidden = p !== pre;
    for (const b of term.querySelectorAll<HTMLElement>('.term-tabs button')) b.setAttribute('aria-pressed', String(b.dataset.variant === name));
    term.querySelector<HTMLElement>('.term-copy')!.dataset.copy = pre.dataset.command!;
  }
}
try {
  const saved = localStorage.getItem('term-variant');
  if (saved) useVariant(saved);
} catch {
  // no storage (private window): the first variant stays
}

document.addEventListener('click', (e) => {
  const tab = (e.target as HTMLElement).closest<HTMLElement>('.term-tabs button');
  if (tab) {
    useVariant(tab.dataset.variant!);
    try {
      localStorage.setItem('term-variant', tab.dataset.variant!);
    } catch {
      // works for this page view all the same
    }
    return;
  }
  const copy = (e.target as HTMLElement).closest<HTMLElement>('[data-copy]');
  if (copy) copyFrom(copy);
});
