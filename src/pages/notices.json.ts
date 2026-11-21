/*
 * What gl-i.net currently shows as a bar or panel, for other sites and
 * scripts. firmware.gl-i.net and its terminal menu read this.
 * Format: README → "Notices for other sites".
 */
import { feedItems } from '../lib/advisories';
import { loadContent } from '../lib/content';

export function GET() {
  const { site, security } = loadContent();
  const body = {
    version: 1,
    generated: new Date().toISOString(),
    source: new URL('/security/', site.url).href,
    notices: feedItems(security, site.url),
    // When a bar next appears or ends on its own (null: nothing scheduled).
    next_change: security.nextChange,
  };
  return new Response(JSON.stringify(body, null, 2) + '\n', { headers: { 'Content-Type': 'application/json' } });
}
