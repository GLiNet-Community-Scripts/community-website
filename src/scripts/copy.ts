/** Copy a [data-copy] button's text; select the terminal's code if the clipboard is unavailable. */
export function copyFrom(button: HTMLElement) {
  const label = button.querySelector('span');
  const done = () => {
    if (!label) return;
    label.textContent = 'Copied';
    setTimeout(() => (label.textContent = 'Copy'), 1600);
  };
  const selectInstead = () => {
    const code = button.closest('.term')?.querySelector('pre:not([hidden]) code');
    if (!code) return;
    const range = document.createRange();
    range.selectNodeContents(code);
    const sel = getSelection()!;
    sel.removeAllRanges();
    sel.addRange(range);
  };
  navigator.clipboard?.writeText(button.dataset.copy!).then(done, selectInstead) ?? selectInstead();
}
