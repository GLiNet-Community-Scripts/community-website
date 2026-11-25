// One request per page for what changes between builds: the worker's live.json with the
// version of the script and the reported table. Shared by script-version.ts and
// reported-live.ts, so a page that shows both still asks once.
const asked = new Map<string, Promise<unknown>>();

export function liveJson(url: string): Promise<unknown> {
  if (!asked.has(url)) asked.set(url, fetch(url).then((r) => (r.ok ? r.json() : null)).catch(() => null));
  return asked.get(url)!;
}
