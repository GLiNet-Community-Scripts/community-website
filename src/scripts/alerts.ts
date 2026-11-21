/*
 * Dismissing a notice or the green "resolved" bar. Remembered in
 * localStorage per revision, so an updated one shows up again. (The inline
 * script in SiteHeader hides dismissed bars before they paint.)
 */
document.addEventListener('click', (e) => {
  const dismiss = (e.target as HTMLElement).closest<HTMLElement>('[data-dismiss]');
  if (!dismiss) return;
  dismiss.closest<HTMLElement>('.alert-bar')!.hidden = true;
  try {
    localStorage.setItem(`dismissed:${dismiss.dataset.dismiss}`, '1');
  } catch {
    /* private mode: just don't remember */
  }
});
