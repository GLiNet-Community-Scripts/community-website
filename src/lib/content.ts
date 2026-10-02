/*
 * Loads and validates the YAML content at build time and merges it with
 * the GitHub data written by scripts/fetch-github.mjs. Any schema
 * violation or dangling reference fails the build with a readable
 * message; the YAML files are the only place content is edited.
 */
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { z } from 'zod';
import { ICON_NAMES } from './icons';
import { gradientFor } from './tiles';

// Anchors used by the page itself; app ids must not collide with them.
const RESERVED_IDS = ['top', 'browse', 'results', 'official', 'install', 'submit', 'about'];

export const TYPE_LABEL = {
  'router-script': 'Router script',
  'luci-app': 'LuCI app',
  'router-service': 'Router service',
  'desktop-app': 'Desktop app',
  docker: 'Docker',
  bot: 'Bot',
  firmware: 'Firmware',
  docs: 'Docs',
  'module-tools': 'Modem tools',
} as const;

const LinkSchema = z.object({
  label: z.string().min(1),
  url: z.string().url(),
});

const AppSchema = z.object({
  repo: z.string().regex(/^[\w.-]+$/),
  upstream: z.string().regex(/^[\w.-]+\/[\w.-]+$/),
  author: z.string().min(1),
  name: z.string().min(1),
  kind: z.enum(['tool', 'official', 'docs']),
  category: z.string().min(1),
  type: z.enum(Object.keys(TYPE_LABEL) as [keyof typeof TYPE_LABEL, ...(keyof typeof TYPE_LABEL)[]]),
  tagline: z.string().min(1),
  description: z.string().min(1),
  features: z.array(z.string().min(1)).default([]),
  install: z.string().min(1).nullish(),
  install_note: z.string().min(1).nullish(),
  devices: z.array(z.string().min(1)).default([]),
  firmware: z.string().min(1).nullish(),
  license: z.string().min(1).nullish(),
  tech: z.array(z.string().min(1)).default([]),
  links: z.array(LinkSchema).default([]),
  readiness: z.enum(['stable', 'beta', 'experimental']).default('stable'),
  icon: z.enum(ICON_NAMES),
  notes: z.string().min(1).nullish(),
});

const CategorySchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  intro: z.string().min(1),
});

const SiteSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  url: z.string().url(),
  org: z.string().min(1),
  hero: z.object({
    eyebrow: z.string(),
    heading: z.string(),
    sub: z.string(),
    suggestions: z.array(z.string()),
  }),
  disclaimer: z.object({
    short: z.string().min(1),
    long: z.string().min(1),
    official: LinkSchema,
  }),
  maintainer: z.object({
    name: z.string().min(1),
    links: z.array(LinkSchema).min(1),
  }),
  official: z.array(LinkSchema),
  ignore: z.array(z.string()),
});

const GithubSchema = z.object({
  generatedAt: z.string(),
  repos: z.record(
    z.string(),
    z.object({
      stars: z.number().int().nonnegative(),
      updated: z.string().nullable(),
      version: z.string().nullable(),
      archived: z.boolean().default(false),
    }),
  ),
});

type AppInput = z.infer<typeof AppSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type Site = z.infer<typeof SiteSchema>;

export interface App extends AppInput {
  id: string;
  stars: number;
  updated: string | null;
  version: string | null;
  archived: boolean;
  gradient: [string, string];
  search: string;
}

function loadYaml(file: string): unknown {
  return YAML.parse(fs.readFileSync(path.join(process.cwd(), 'content', file), 'utf8'));
}

function parseOrDie<T>(schema: z.ZodType<T>, data: unknown, file: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid content in ${file}:\n${issues}`);
  }
  return result.data;
}

function loadGithub() {
  for (const file of ['github.json', 'github-fallback.json']) {
    const abs = path.join(process.cwd(), 'src', 'data', file);
    if (fs.existsSync(abs)) {
      return parseOrDie(GithubSchema, JSON.parse(fs.readFileSync(abs, 'utf8')), `src/data/${file}`);
    }
  }
  return { generatedAt: new Date().toISOString(), repos: {} };
}

const slug = (repo: string) =>
  repo.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const byStars = (a: App, b: App) => b.stars - a.stars || a.name.localeCompare(b.name);
export const byUpdated = (a: App, b: App) =>
  (b.updated ? Date.parse(b.updated) : 0) - (a.updated ? Date.parse(a.updated) : 0) || b.stars - a.stars;

export function loadContent() {
  const site = parseOrDie(SiteSchema, loadYaml('site.yaml'), 'content/site.yaml');
  const categories = parseOrDie(z.array(CategorySchema), loadYaml('categories.yaml'), 'content/categories.yaml');
  const inputs = parseOrDie(z.array(AppSchema), loadYaml('apps.yaml'), 'content/apps.yaml');
  const github = loadGithub();

  const categoryIds = new Set(categories.map((c) => c.id));
  const seen = new Set<string>();
  const perCategory = new Map<string, number>();

  const apps: App[] = inputs.map((input) => {
    const id = slug(input.repo);
    if (seen.has(id)) throw new Error(`Duplicate repository "${input.repo}" in content/apps.yaml`);
    if (RESERVED_IDS.includes(id) || id.startsWith('install-') || id.startsWith('cat-')) {
      throw new Error(`Repository "${input.repo}" would collide with a page anchor ("#${id}").`);
    }
    seen.add(id);
    if (input.kind === 'tool' && !categoryIds.has(input.category)) {
      throw new Error(
        `"${input.repo}" references unknown category "${input.category}". ` +
          `Known categories: ${[...categoryIds].join(', ')}`,
      );
    }
    const n = perCategory.get(input.category) ?? 0;
    perCategory.set(input.category, n + 1);
    const gh = github.repos[input.repo];
    return {
      ...input,
      id,
      stars: gh?.stars ?? 0,
      updated: gh?.updated ?? null,
      version: gh?.version ?? null,
      archived: gh?.archived ?? false,
      gradient: gradientFor(input.category, n),
      search: [
        input.name, input.repo, input.author, input.tagline, input.description,
        ...input.features, ...input.devices, ...input.tech, TYPE_LABEL[input.type],
      ].join(' ').toLowerCase(),
    };
  });

  const tools = apps.filter((a) => a.kind === 'tool');
  const official = apps.filter((a) => a.kind !== 'tool').sort(byStars);
  const sections = categories
    .map((category) => ({ category, apps: tools.filter((a) => a.category === category.id).sort(byStars) }))
    .filter((s) => s.apps.length > 0);

  return {
    site,
    sections,
    tools,
    official,
    popular: [...tools].sort(byStars).slice(0, 5),
    recent: [...tools].filter((a) => a.updated).sort(byUpdated).slice(0, 5),
    stats: {
      apps: tools.length,
      authors: new Set(tools.map((a) => a.author.toLowerCase())).size,
      stars: tools.reduce((sum, a) => sum + a.stars, 0),
    },
    generatedAt: github.generatedAt,
  };
}

export type Content = ReturnType<typeof loadContent>;
