// A menu of the page's sections at the side, as on Wikipedia: built from the headings,
// shown where the window is wide enough, with the section in view marked.
const secs = [...document.querySelectorAll<HTMLElement>('.sa-article section[id]')].filter((s) => s.querySelector('h2'));
if (secs.length > 2) {
  const nav = document.createElement('nav'), links = new Map<string, HTMLAnchorElement>();
  nav.className = 'sa-toc';
  nav.setAttribute('aria-label', 'On this page');
  for (const s of secs) {
    const a = document.createElement('a');
    a.href = '#' + s.id;
    a.textContent = s.querySelector('h2')!.textContent!.trim();
    links.set(s.id, a);
    nav.append(a);
  }
  document.querySelector('.sa-article')!.prepend(nav);
  const mark = () => {
    const now = secs.filter((s) => s.getBoundingClientRect().top < innerHeight * 0.35).pop() ?? secs[0];
    for (const [id, a] of links) a.classList.toggle('on', id === now.id);
  };
  addEventListener('scroll', mark, { passive: true });
  mark();
}
