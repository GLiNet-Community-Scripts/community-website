/*
 * Helpers for the guide of an advisory (components/AdvisoryGuide.astro): the lane of a
 * timeline entry and the chart that shows all entries on one time axis.
 */
export interface GuideEvent {
  at: string;
  text: string;
  more?: string;
  tag?: string;
}

export type Lane = 'A' | 'V' | 'C';
export const LANES: Record<Lane, string> = { A: 'Attack', V: 'GL.iNet', C: 'Community' };

/** The row an entry belongs to: the attacker's, GL.iNet's or the community's. */
export const lane = (tag?: string): Lane => (tag === 'Attack' ? 'A' : tag === 'Vendor' ? 'V' : 'C');

/** An entry without a time of day stands at noon of its day. */
export const moment = (at: string) => Date.parse(at.length === 10 ? `${at}T12:00Z` : at);
export const dated = (at: string) => at.length === 10;

/** Text as it stands in a title or a label: without the backticks around commands. */
export const plain = (s: string) => s.replace(/`/g, '');

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const DAY = 86_400_000;

/**
 * The overview above the timeline: devices hit per hour as bars, and below them one row of
 * dots each for the attack, GL.iNet and the community. A dot links to its entry (#ev-N,
 * N being the entry's place in `events`); a hollow dot has no time of day.
 */
export function timelineChart(hours: { hour: string; n: number }[], events: GuideEvent[]): string {
  const times = events.map((e) => moment(e.at));
  const t0 = Math.floor(Math.min(...times) / DAY) * DAY;
  const t1 = Math.ceil((Math.max(...times) + 1) / (DAY / 2)) * (DAY / 2);
  const W = 928, L = 86, R = 14;
  const x = (ms: number) => L + ((ms - t0) / (t1 - t0)) * (W - L - R);
  const max = Math.max(1, ...hours.map((h) => h.n));
  const short = (ms: number) => new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  let s = `<svg class="g-chart" viewBox="0 0 ${W} 236" role="img" aria-label="The attack, GL.iNet's steps and the community's findings on one time axis">`;
  for (let d = t0; d <= t1; d += DAY) {
    s += `<line class="g" x1="${x(d).toFixed(1)}" y1="14" x2="${x(d).toFixed(1)}" y2="196"/>`;
    if (x(d) < W - R - 40) s += `<text class="ax" x="${(x(d) + 4).toFixed(1)}" y="212">${short(d)}</text>`;
  }
  for (let d = t0 + DAY / 2; d <= t1; d += DAY) {
    s += `<line class="g2" x1="${x(d).toFixed(1)}" y1="14" x2="${x(d).toFixed(1)}" y2="196"/>`;
    if (x(d) < W - R - 40) s += `<text class="ax2" x="${(x(d) + 4).toFixed(1)}" y="212">12:00</text>`;
  }
  s += '<text class="lane" x="0" y="60">Routers hit</text><text class="lane2" x="0" y="74">per hour</text>';
  s += '<text class="lane" x="0" y="124">Attack</text><text class="lane" x="0" y="154">GL.iNet</text><text class="lane" x="0" y="184">Community</text>';
  s += `<line class="base" x1="${L}" y1="96" x2="${W - R}" y2="96"/>`;
  for (const h of hours) {
    const t = Date.parse(`${h.hour}:00Z`), w = x(t + 3_600_000) - x(t) - 1, ht = Math.max(2, (h.n / max) * 78);
    s += `<rect class="bar" x="${x(t).toFixed(1)}" y="${(96 - ht).toFixed(1)}" width="${w.toFixed(1)}" height="${ht.toFixed(1)}"><title>${h.hour.slice(5).replace('T', ' ')}:00 UTC: ${h.n} routers</title></rect>`;
    if (h.n >= max / 2) s += `<text class="peak" x="${(x(t) + w / 2).toFixed(1)}" y="${(96 - ht - 4).toFixed(1)}">${h.n}</text>`;
  }
  for (const y of [120, 150, 180]) s += `<line class="rail" x1="${L}" y1="${y}" x2="${W - R}" y2="${y}"/>`;
  events.forEach((e, i) => {
    const who = lane(e.tag), y = { A: 120, V: 150, C: 180 }[who];
    const at = dated(e.at) ? e.at : `${e.at.slice(0, 16).replace('T', ' ')} UTC`;
    s += `<a href="#ev-${i}"><circle class="dot d-${who}${dated(e.at) ? ' open' : ''}" cx="${x(moment(e.at)).toFixed(1)}" cy="${y}" r="5.5"><title>${esc(at)}: ${esc(plain(e.text))}</title></circle></a>`;
  });
  return `${s}</svg>`;
}
