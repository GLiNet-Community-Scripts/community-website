/*
 * The same as /notices.json, as tab-separated lines for shell scripts
 * (BusyBox awk/cut is enough). One line per notice, no header:
 *   level  id  updated  url  text
 * level is critical | warning | info | resolved. Empty file: nothing to show.
 */
import { feedItems } from '../lib/advisories';
import { loadContent } from '../lib/content';

const clean = (s: string) => s.replace(/[\t\r\n]+/g, ' ').trim();

export function GET() {
  const { site, security } = loadContent();
  const lines = feedItems(security, site.url).map((n) => [n.level, n.id, n.updated, n.url, clean(n.text)].join('\t'));
  return new Response(lines.length ? lines.join('\n') + '\n' : '', { headers: { 'Content-Type': 'text/tab-separated-values; charset=utf-8' } });
}
