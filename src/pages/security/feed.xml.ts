/*
 * RSS 2.0 feed of all advisories. The guid includes the "updated" stamp, so
 * feed readers show an advisory again whenever it changes.
 */
import { SEVERITY } from '../../lib/advisories';
import { loadContent } from '../../lib/content';

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!);

export function GET() {
  const { site, security } = loadContent();
  const items = security.advisories.map((a) => {
    const link = new URL(a.url, site.url).href;
    const head = [SEVERITY[a.severity].label, a.statusLabel, a.exploited ? 'exploited' : ''].filter(Boolean).join(' · ');
    const steps = a.actions
      .flatMap((g) => g.steps.map((s) => `${g.audience ? `${g.audience}: ` : ''}${s.title}`))
      .map((s) => `• ${s}`)
      .join('\n');
    return `    <item>
      <title>${esc(`${a.id}: ${a.title}`)}</title>
      <link>${link}</link>
      <guid isPermaLink="false">${esc(`${a.id}@${a.updated}`)}</guid>
      <pubDate>${new Date(a.updated).toUTCString()}</pubDate>
      <description>${esc(`${head}. ${a.summary}\n\nWhat to do:\n${steps}`)}</description>
    </item>`;
  });
  const latest = security.advisories.map((a) => Date.parse(a.updated)).sort((x, y) => y - x)[0] ?? Date.now();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>gl-i.net security advisories (unofficial)</title>
    <link>${new URL('/security/', site.url).href}</link>
    <atom:link href="${new URL('/security/feed.xml', site.url).href}" rel="self" type="application/rss+xml" />
    <description>Security issues in GL.iNet routers and services, written by the community. Not affiliated with GL.iNet.</description>
    <language>en</language>
    <lastBuildDate>${new Date(latest).toUTCString()}</lastBuildDate>
${items.join('\n')}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
