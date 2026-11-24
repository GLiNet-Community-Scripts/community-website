const DAY = 86_400_000;

export const fmt = (n: number) => n.toLocaleString('en-US');

export function ago(iso: string, now: number = Date.now()): string {
  const d = Math.floor((now - Date.parse(iso)) / DAY);
  if (d <= 0) return 'today';
  if (d === 1) return 'yesterday';
  if (d < 31) return `${d} days ago`;
  const m = Math.round(d / 30.4);
  if (m < 12) return `${m} month${m > 1 ? 's' : ''} ago`;
  const y = Math.round(d / 365);
  return `${y} year${y > 1 ? 's' : ''} ago`;
}

export const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

export const stamp = (iso: string) =>
  new Date(iso).toLocaleString('en-US', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'UTC', timeZoneName: 'short',
  });

/** A date ("Nov 20, 2026") or a moment ("Nov 20, 2026, 17:05 UTC"), as written in the YAML. */
export const when = (s: string) => (s.includes('T') ? stamp(s) : longDate(s));

/** Short form for tight lists: "Nov 20" or "Nov 20, 17:05". */
export function dayTime(s: string): string {
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', timeZone: 'UTC' };
  if (s.includes('T')) Object.assign(opts, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  return new Date(s).toLocaleString('en-US', opts);
}
