/*
 * Banner and advisory panel on every page: "hide details" on the home page
 * panel and dismissing notices or the "resolved" card. Both are remembered
 * in localStorage per revision, so an updated advisory shows up again.
 * (The inline scripts next to the markup apply the stored state before paint.)
 */
const store = {
  set(key: string, on: boolean) {
    try {
      if (on) localStorage.setItem(key, '1');
      else localStorage.removeItem(key);
    } catch {
      /* private mode: just don't remember */
    }
  },
};

document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;

  const toggle = target.closest<HTMLButtonElement>('[data-toggle]');
  if (toggle) {
    const panel = toggle.closest<HTMLElement>('[data-collapsible]')!;
    const compact = panel.classList.toggle('is-compact');
    toggle.setAttribute('aria-expanded', String(!compact));
    toggle.querySelector('.t')!.textContent = compact ? 'Show details' : 'Hide details';
    toggle.setAttribute('aria-label', compact ? 'Show details' : 'Hide details');
    store.set(`collapsed:${panel.dataset.collapsible}`, compact);
    return;
  }

  const dismiss = target.closest<HTMLElement>('[data-dismiss]');
  if (dismiss) {
    const box = dismiss.closest<HTMLElement>('.alert-bar, .adv-wrap')!;
    box.hidden = true;
    store.set(`dismissed:${dismiss.dataset.dismiss}`, true);
  }
});
