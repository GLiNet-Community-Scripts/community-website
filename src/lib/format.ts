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
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

export const stamp = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC', timeZoneName: 'short',
  });
