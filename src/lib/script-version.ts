// The version of a script as served now and its release time, as the worker's live.json
// gives them ({ "script": { "version": "2.55", "released": "2026-11-24T14:41:00Z" } }).
// Read once per build for the page itself, and again in the reader's browser
// (scripts/script-version.ts). Only values of the expected shape are taken.
export interface ScriptVersion {
  version: string;
  /** "2026-11-24T14:41:00Z", or '' when not known */
  released: string;
}

export function parseScriptVersion(live: unknown): ScriptVersion | null {
  const s = live !== null && typeof live === 'object' ? (live as { script?: unknown }).script : null;
  if (s === null || typeof s !== 'object') return null;
  const { version, released } = s as Record<string, unknown>;
  if (typeof version !== 'string' || !/^\d{1,2}\.\d{1,3}$/.test(version)) return null;
  const at = typeof released === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:00Z$/.test(released) && !Number.isNaN(Date.parse(released)) ? released : '';
  return { version, released: at };
}

const asked = new Map<string, Promise<ScriptVersion | null>>();
export function scriptVersion(url: string): Promise<ScriptVersion | null> {
  if (!asked.has(url)) {
    asked.set(
      url,
      fetch(url, { signal: AbortSignal.timeout(8000) })
        .then((r) => (r.ok ? r.json() : null))
        .then(parseScriptVersion)
        .catch(() => null)
        .then((v) => {
          if (!v) console.warn(`[script-version] no version from ${url}, the page keeps its fallback text`);
          return v;
        }),
    );
  }
  return asked.get(url)!;
}
