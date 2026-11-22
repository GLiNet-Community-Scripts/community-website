// The "reported" table of an advisory: on which models and firmware versions traces were
// reported. The advisory's YAML holds the list kept by hand. An advisory may also name a
// live list (affected.reported.live), worked out from the anonymous reports; it is added
// to the one kept by hand, at build time and again in the reader's browser. Used by the
// page and by the script that refreshes it, so both draw the same table.

export type RepModel = { name: string; sku?: string; kind?: string; firmware: string[] };
export type LiveReported = { as_of: string; models: { sku: string; kind: string; firmware: string[] }[] };

const verKey = (v: string) => v.split(/[^0-9]+/).filter(Boolean).map((n) => n.padStart(4, '0')).join('.');
export const byVer = (x: string, y: string) => verKey(x).localeCompare(verKey(y));
/** The release series of a version: 4.8 for 4.8.3. One column per series. */
export const series = (v: string) => v.split(/[^0-9]+/).filter(Boolean).slice(0, 2).join('.') || v;
export const pluralKind = (kind: string) => ({ Router: 'Routers', KVM: 'KVM devices' }[kind] ?? (kind || 'Devices'));

/**
 * The live list as the page accepts it: only values of the expected shape, because they
 * come from another server and go into the page. Anything else means "no live list".
 */
export function parseLive(x: unknown): LiveReported | null {
  if (x === null || typeof x !== 'object') return null;
  const o = x as Record<string, unknown>;
  if (typeof o.as_of !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\dZ$/.test(o.as_of) || Number.isNaN(Date.parse(o.as_of))) return null;
  if (!Array.isArray(o.models) || o.models.length > 200) return null;
  const models: LiveReported['models'] = [];
  for (const m of o.models as Record<string, unknown>[]) {
    if (m === null || typeof m !== 'object') return null;
    if (typeof m.sku !== 'string' || !/^GL-[A-Z0-9-]{2,16}$/.test(m.sku)) return null;
    if (m.kind !== 'Router' && m.kind !== 'KVM') return null;
    if (!Array.isArray(m.firmware) || m.firmware.length > 60 || !m.firmware.every((v) => typeof v === 'string' && /^\d{1,2}\.\d{1,3}(\.\d{1,3})?(-op\d{2})?$/.test(v))) return null;
    models.push({ sku: m.sku, kind: m.kind, firmware: m.firmware as string[] });
  }
  return { as_of: o.as_of, models };
}

/** The list kept by hand with the live one added: more versions for a model, or more models. */
export function mergeReported(own: RepModel[], live: LiveReported | null): RepModel[] {
  const out = own.map((m) => ({ ...m, firmware: [...m.firmware] }));
  for (const l of live?.models ?? []) {
    let m = out.find((x) => (x.sku ?? x.name) === l.sku);
    if (!m) out.push((m = { name: l.sku, sku: l.sku, kind: l.kind, firmware: [] }));
    for (const v of l.firmware) if (!m.firmware.includes(v)) m.firmware.push(v);
  }
  return out;
}

/** The later of the two times: when the list by hand was last touched, or the live one worked out. */
export const laterOf = (own: string, live: LiveReported | null) => (live && Date.parse(live.as_of) > Date.parse(own) ? live.as_of : own);

/**
 * One table per kind of device, because routers and KVMs count their firmware
 * differently. A column is a release series (4.8), a cell holds the versions of that
 * series with reports (4.8.3, 4.8.4). One column per version made the table scroll.
 */
export function repGroups(models: RepModel[]) {
  return [...new Set(models.map((m) => m.kind ?? ''))].map((kind) => {
    const ms = models.filter((m) => (m.kind ?? '') === kind);
    return { kind, models: ms, cols: [...new Set(ms.flatMap((m) => m.firmware.map(series)))].sort(byVer) };
  });
}
