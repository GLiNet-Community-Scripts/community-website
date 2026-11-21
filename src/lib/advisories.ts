/*
 * Security advisories (content/advisories/*.yaml) and short notices
 * (content/notices.yaml). Loaded and validated at build time like the rest
 * of the content. An advisory drives its own page under /security/, the
 * archive, the RSS feed and, while it is active, the bar on every page,
 * the nav pill, the install sheet notes and the card markers.
 */
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { z } from 'zod';

export const SEVERITY = {
  critical: { label: 'Critical', hint: 'From the internet, no login needed' },
  high: { label: 'High', hint: 'From the local network, or with a login' },
  medium: { label: 'Medium', hint: 'Limited impact or an unusual setup' },
  low: { label: 'Low', hint: 'Hardening, no known attack' },
} as const;

export const STATUS = {
  investigating: { label: 'Under investigation', cls: 'investigating', active: true },
  'fix-rolling-out': { label: 'Fix rolling out', cls: 'rolling', active: true },
  mitigated: { label: 'Workaround only', cls: 'rolling', active: true },
  fixed: { label: 'Fixed', cls: 'fixed', active: false },
  'no-fix': { label: 'No fix', cls: 'nofix', active: false },
} as const;

export const CONFIRMED = {
  'gl-inet-public': {
    label: 'Confirmed by GL.iNet',
    short: 'GL.iNet',
    cls: 'public',
    hint: 'A public statement, release note or forum post by GL.iNet.',
  },
  'gl-inet-staff': {
    label: 'Confirmed by GL.iNet staff',
    short: 'GL.iNet staff',
    cls: 'staff',
    hint: 'Confirmed to the maintainers directly. We only share what GL.iNet agreed to.',
  },
  unconfirmed: {
    label: 'Not confirmed yet',
    short: 'Not confirmed',
    cls: 'unconfirmed',
    hint: 'User or researcher reports that we checked but GL.iNet hasn’t confirmed.',
  },
} as const;

export const SOURCE_TYPE = {
  'gl-inet': { who: 'GL.iNet', what: 'Statement', kind: 'vendor' },
  'gl-inet-forum': { who: 'GL.iNet', what: 'Forum post', kind: 'vendor' },
  'gl-inet-release-notes': { who: 'GL.iNet', what: 'Release notes', kind: 'vendor' },
  'gl-inet-staff': { who: 'GL.iNet staff', what: 'Direct contact', kind: 'vendor' },
  cve: { who: 'CVE record', what: 'CVE program', kind: 'ext' },
  researcher: { who: 'Researcher', what: 'Write-up', kind: 'ext' },
  community: { who: 'Community', what: 'User reports', kind: 'com' },
} as const;

type Keys<T> = [keyof T & string, ...(keyof T & string)[]];
const keys = <T extends object>(o: T) => Object.keys(o) as Keys<T>;

const isGlinet = (url: string) => {
  const host = new URL(url).hostname;
  return host === 'gl-inet.com' || host.endsWith('.gl-inet.com');
};
const CVE_HOSTS = ['nvd.nist.gov', 'www.cve.org', 'cve.org', 'cve.mitre.org'];

const Day = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'expected a date like 2026-11-20')
  .refine((s) => !Number.isNaN(Date.parse(s)), 'not a valid date');
const Moment = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?(Z|[+-]\d{2}:\d{2}))?$/,
    'expected 2026-11-20, or 2026-11-20T18:05+01:00 (a time needs a zone)',
  )
  .refine((s) => !Number.isNaN(Date.parse(s)), 'not a valid date');
const Https = z.string().url().refine((u) => u.startsWith('https://'), 'links must use https://');
const GlinetLink = z.object({
  label: z.string().min(1),
  url: Https.refine(isGlinet, 'must point to gl-inet.com (docs, downloads, forum)'),
});

const StepSchema = z.object({
  title: z.string().min(1),
  text: z.string().min(1).optional(),
  link: GlinetLink.optional(),
});

const SourceSchema = z
  .object({
    type: z.enum(keys(SOURCE_TYPE)),
    label: z.string().min(1).optional(),
    url: Https.optional(),
    note: z.string().min(1).optional(),
    date: Day,
  })
  .superRefine((s, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: 'custom', message });
    if (s.type === 'gl-inet-staff') {
      if (s.url) fail('a direct confirmation by GL.iNet staff has no public URL; describe it in "note"');
      if (!s.note) fail('"note" is required for gl-inet-staff');
      return;
    }
    if (!s.label || !s.url) return fail(`"label" and "url" are required for ${s.type}`);
    if (s.type.startsWith('gl-inet') && !isGlinet(s.url)) fail(`a ${s.type} source must link to gl-inet.com`);
    if (s.type === 'cve' && !CVE_HOSTS.includes(new URL(s.url).hostname)) {
      fail(`a cve source must link to ${CVE_HOSTS.join(' or ')}`);
    }
  });

const AdvisorySchema = z.object({
  id: z.string().regex(/^CSA-\d{4}-\d{2,}$/, 'expected an ID like CSA-2026-01'),
  title: z.string().min(1).max(120),
  severity: z.enum(keys(SEVERITY)),
  vendor_severity: z.string().min(1).optional(),
  exploited: z.boolean().default(false),
  status: z.enum(keys(STATUS)),
  published: Day,
  updated: Moment,
  banner: z.string().min(1).max(170).optional(),
  // Active advisories only: the bar disappears after this date (end of day, UTC)
  // or moment. Fixed ones show a green "Resolved" bar for RESOLVED_HOURS by themselves.
  banner_until: Moment.optional(),
  cve: z.union([z.literal('requested'), z.array(z.string().regex(/^CVE-\d{4}-\d{4,}$/))]).default([]),
  confirmed: z.enum(keys(CONFIRMED)),
  summary: z.string().min(1),
  affected: z.object({
    summary: z.string().min(1),
    products: z.array(z.string().min(1)).default([]),
    firmware: z.string().min(1).optional(),
    fixed_in: z.string().min(1).optional(),
    not_affected: z.string().min(1).optional(),
  }),
  models: z
    .array(
      z.object({
        name: z.string().min(1),
        sku: z.string().min(1).optional(),
        affected: z.string().min(1),
        fixed: z.string().min(1).optional(),
        released: Day.optional(),
        expected: z.string().min(1).optional(),
        eol: z.boolean().default(false),
        note: z.string().min(1).optional(),
      }),
    )
    .default([]),
  actions: z
    .array(z.object({ audience: z.string().min(1).optional(), steps: z.array(StepSchema).min(1) }))
    .min(1),
  check: z
    .array(
      z.object({
        title: z.string().min(1),
        text: z.string().min(1).optional(),
        menu: z.array(z.string().min(1)).optional(),
        command: z.string().min(1).optional(),
      }),
    )
    .default([]),
  details: z.string().min(1).optional(),
  unknowns: z.array(z.string().min(1)).default([]),
  timeline: z.array(z.object({ at: Moment, text: z.string().min(1), tag: z.string().min(1).optional() })).min(1),
  sources: z.array(SourceSchema).min(1),
  contacts: z
    .array(
      z.object({
        label: z.string().min(1),
        email: z.string().email().refine((e) => e.endsWith('@gl-inet.com'), 'only @gl-inet.com addresses'),
      }),
    )
    .default([]),
  apps: z.array(z.string().min(1)).default([]),
  apps_note: z.string().min(1).optional(),
  // A fix or check tool built by the community, shown as its own card right
  // after "Do this now" and as a link in the bar. Not GL.iNet's.
  community_fix: z
    .object({
      title: z.string().min(1).max(90),
      text: z.string().min(1),
      // What it is not: shown in the card under the text.
      caveat: z.string().min(1),
      // Optional one-liner at the top of "Do this now", before GL.iNet's steps,
      // when the tool should be run before them (a reset wipes what it looks for).
      before: z.string().min(1).max(160).optional(),
      link: z.object({ label: z.string().min(1), url: z.union([z.string().regex(/^\/[a-z0-9/-]*$/), Https]) }),
      image: z.string().regex(/^\/[a-z0-9/._-]+$/).optional(),
    })
    .optional(),
  // Our own view as the community team, kept apart from what GL.iNet says.
  community: z
    .object({
      date: Day,
      notes: z
        .array(
          z.object({
            title: z.string().min(1).max(90),
            text: z.string().min(1),
            // Optional one-liner shown at the top of "Do this now", before the steps,
            // when people should read this note before they act.
            before: z.string().min(1).max(160).optional(),
            // Optional link to community work (a script, a write-up): a page of
            // this site ("/security/csa-2026-01/fix/") or an https:// address.
            // Unlike the links in "actions" it may point outside gl-inet.com.
            link: z
              .object({ label: z.string().min(1), url: z.union([z.string().regex(/^\/[a-z0-9/-]*$/), Https]) })
              .optional(),
          }),
        )
        .min(1),
    })
    .optional(),
});

const NoticeSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  level: z.enum(['info', 'warning']).default('info'),
  text: z.string().min(1).max(170),
  link: z.object({ label: z.string().min(1), url: Https }).optional(),
  from: Moment.optional(),
  until: Moment,
  dismissible: z.boolean().default(true),
});

type AdvisoryInput = z.infer<typeof AdvisorySchema>;
export type Notice = z.infer<typeof NoticeSchema>;
export type BannerLevel = 'critical' | 'warning' | 'resolved';

export interface Advisory extends AdvisoryInput {
  slug: string;
  url: string;
  active: boolean;
  /** Colour of the advisory: critical/warning while active (by severity), resolved after. */
  tone: BannerLevel;
  /** The same while the bar is shown, null when it isn't (expired or never). */
  level: BannerLevel | null;
  /** When the bar disappears (ISO), null when it stays as long as the advisory is active. */
  bannerEnds: string | null;
  /** Archive filter bucket. */
  bucket: 'active' | 'fixed' | 'nofix';
  statusLabel: string;
  fixedIn: string | null;
  rollout: { released: number; total: number } | null;
  year: string;
}

const RANK = { critical: 0, high: 1, medium: 2, low: 3 };

/** How long a fixed advisory keeps its green "Resolved" bar after "updated". */
export const RESOLVED_HOURS = 48;

/** End of a day (UTC) for date-only values, the instant itself otherwise. */
const until = (s: string) => Date.parse(s) + (s.includes('T') ? 0 : 86_400_000 - 1);

function parse<T>(schema: z.ZodType<T>, data: unknown, file: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`).join('\n');
    throw new Error(`Invalid content in ${file}:\n${issues}`);
  }
  return result.data;
}

function readAdvisories(appIds: Set<string>, now: number): Advisory[] {
  const dir = path.join(process.cwd(), 'content', 'advisories');
  if (!fs.existsSync(dir)) return [];
  const seen = new Set<string>();
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.yaml') && !f.startsWith('_'))
    .map((f) => {
      const file = `content/advisories/${f}`;
      const a = parse(AdvisorySchema, YAML.parse(fs.readFileSync(path.join(dir, f), 'utf8')), file);
      const die = (msg: string) => {
        throw new Error(`${file}: ${msg}`);
      };
      const slug = a.id.toLowerCase();
      if (f !== `${slug}.yaml`) die(`the file name must be ${slug}.yaml to match the id ${a.id}`);
      if (seen.has(a.id)) die(`duplicate id ${a.id}`);
      seen.add(a.id);

      const status = STATUS[a.status];
      if (status.active && !a.banner) die('an active advisory needs "banner", the one-line text for the top bar');
      if (!status.active && a.banner_until) {
        die(`"banner_until" is for active advisories; a fixed one shows its "Resolved" bar for ${RESOLVED_HOURS} hours after "updated" by itself`);
      }
      if (a.confirmed !== 'unconfirmed') {
        const wanted = a.confirmed === 'gl-inet-staff' ? ['gl-inet-staff'] : ['gl-inet', 'gl-inet-forum', 'gl-inet-release-notes'];
        if (!a.sources.some((s) => wanted.includes(s.type))) {
          die(`confirmed: ${a.confirmed} needs a source of type ${wanted.join(' or ')}`);
        }
      }
      for (const id of a.apps) if (!appIds.has(id)) die(`apps: unknown app "${id}" (use the id from the app's page anchor)`);

      // Colour of the advisory everywhere; the bar uses it while it is shown.
      const tone: BannerLevel = status.active ? (RANK[a.severity] <= RANK.high ? 'critical' : 'warning') : 'resolved';
      const ends = status.active
        ? (a.banner_until ? until(a.banner_until) : null)
        : a.status === 'fixed' ? Date.parse(a.updated) + RESOLVED_HOURS * 3_600_000 : null;
      const shown = status.active ? ends === null || now <= ends : Boolean(a.banner) && ends !== null && now <= ends;
      const fixable = a.models.filter((m) => !m.eol && m.fixed);
      const fixes = [...new Set(fixable.map((m) => m.fixed!))];
      const fixedIn = a.affected.fixed_in ?? (fixes.length === 1 ? fixes[0] : null);
      const label = a.status === 'fixed' && fixedIn && /^\d/.test(fixedIn) ? `Fixed in ${fixedIn}` : status.label;

      return {
        ...a,
        timeline: [...a.timeline].sort((x, y) => Date.parse(y.at) - Date.parse(x.at)),
        slug,
        url: `/security/${slug}/`,
        active: status.active,
        tone,
        level: shown ? tone : null,
        bannerEnds: ends === null ? null : new Date(ends).toISOString(),
        bucket: status.active ? 'active' : a.status === 'no-fix' ? 'nofix' : 'fixed',
        statusLabel: label,
        fixedIn,
        rollout: fixable.length ? { released: fixable.filter((m) => m.released).length, total: fixable.length } : null,
        year: a.published.slice(0, 4),
      } satisfies Advisory;
    })
    .sort((x, y) => y.published.localeCompare(x.published) || y.id.localeCompare(x.id));
}

function readNotices(): Notice[] {
  const file = path.join(process.cwd(), 'content', 'notices.yaml');
  if (!fs.existsSync(file)) return [];
  return parse(z.array(NoticeSchema).nullable(), YAML.parse(fs.readFileSync(file, 'utf8')), 'content/notices.yaml') ?? [];
}

export function loadSecurity(appIds: Set<string>, now = Date.now()) {
  const advisories = readAdvisories(appIds, now);
  const active = advisories
    .filter((a) => a.active)
    .sort((x, y) => RANK[x.severity] - RANK[y.severity] || Date.parse(y.updated) - Date.parse(x.updated));
  // Active advisories whose bar is shown (banner_until not passed)
  const urgent = active.filter((a) => a.level);
  // The advisory in the bar: the most severe shown one, else a recently fixed one.
  const lead = urgent[0] ?? advisories.find((a) => a.level === 'resolved') ?? null;
  const byApp = new Map<string, Advisory>();
  for (const a of [...urgent].reverse()) for (const id of a.apps) byApp.set(id, a);

  const all = readNotices();
  const notices = all.filter((n) => (!n.from || now >= Date.parse(n.from)) && now <= until(n.until));
  // The next moment a bar appears or disappears on its own. The 30-minute job
  // (.github/workflows/notices-watch.yml) deploys once it has passed.
  const moments = [
    ...advisories.filter((a) => a.level && a.bannerEnds).map((a) => Date.parse(a.bannerEnds!)),
    ...all.flatMap((n) => [n.from ? Date.parse(n.from) : NaN, until(n.until)]),
  ].filter((t) => t > now);
  const nextChange = moments.length ? new Date(Math.min(...moments)).toISOString() : null;
  return { advisories, active, urgent, lead, byApp, notices, nextChange };
}

export type Security = ReturnType<typeof loadSecurity>;

/*
 * Everything that is currently shown as a bar or panel, for other sites and
 * scripts (firmware.gl-i.net, its terminal menu): /notices.json and
 * /notices.tsv. Active advisories first (most severe first), then recently
 * fixed ones, then short notices.
 */
export interface Feed {
  kind: 'advisory' | 'notice';
  id: string;
  level: BannerLevel | Notice['level'];
  text: string;
  url: string;
  updated: string;
  title?: string;
  severity?: Advisory['severity'];
  status?: string;
  exploited?: boolean;
  until?: string;
}

export function feedItems(security: Security, siteUrl: string): Feed[] {
  const abs = (u: string) => new URL(u, siteUrl).href;
  const shown = [...security.urgent, ...security.advisories.filter((a) => a.level === 'resolved')];
  return [
    ...shown.map((a) => ({
      kind: 'advisory' as const,
      id: a.id,
      level: a.level!,
      text: a.banner!,
      url: abs(a.url),
      updated: a.updated,
      title: a.title,
      severity: a.severity,
      status: a.statusLabel,
      exploited: a.exploited,
      ...(a.bannerEnds ? { until: a.bannerEnds } : {}),
    })),
    ...security.notices.map((n) => ({
      kind: 'notice' as const,
      id: n.id,
      level: n.level,
      text: n.text,
      url: n.link?.url ?? abs('/security/'),
      updated: n.from ?? n.until,
      until: n.until,
    })),
  ];
}
