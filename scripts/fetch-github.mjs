#!/usr/bin/env node
/*
 * Fetches live GitHub data for every repository in content/apps.yaml and
 * writes it to src/data/github.json. Runs as `prebuild`.
 *
 * Per repository it reads the ORIGINAL project (the fork parent, or the
 * `upstream` from apps.yaml for mirrored repos), because the synced copy
 * in the organization has no stars or releases of its own:
 *   - stars:   stargazers_count
 *   - updated: pushed_at (last commit), drives "Recently updated"
 *   - version: latest release tag, else the highest version-like tag
 *
 * It also lists all public repositories of the organization and emits a
 * GitHub Actions warning for each one that has no apps.yaml entry and is
 * not in site.yaml `ignore`.
 *
 * Fail-soft: any error (offline, rate limit, deleted repo) falls back to
 * the committed src/data/github-fallback.json for that repository, so the
 * build never breaks.
 */
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

const root = process.cwd();
const outFile = path.join(root, 'src', 'data', 'github.json');
const fallbackFile = path.join(root, 'src', 'data', 'github-fallback.json');
const API = process.env.GITHUB_API_URL ?? 'https://api.github.com';
const CONCURRENCY = 6;

const apps = YAML.parse(fs.readFileSync(path.join(root, 'content', 'apps.yaml'), 'utf8'));
const site = YAML.parse(fs.readFileSync(path.join(root, 'content', 'site.yaml'), 'utf8'));
const ORG = site.org;
const fallbackData = fs.existsSync(fallbackFile)
  ? JSON.parse(fs.readFileSync(fallbackFile, 'utf8'))
  : { generatedAt: null, repos: {} };
const fallback = fallbackData.repos;

const headers = {
  'User-Agent': 'gl-i.net-build',
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
};
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

/** GET a GitHub API path. Returns null on 404, throws on other errors. */
async function gh(apiPath) {
  const res = await fetch(`${API}${apiPath}`, { headers, signal: AbortSignal.timeout(10_000) });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${apiPath}`);
  return res.json();
}

const VERSION_TAG = /^v?\d+(\.\d+)+/i;
function highestTag(tags) {
  const names = (tags ?? []).map((t) => t.name).filter((n) => VERSION_TAG.test(n));
  names.sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
  return names.at(-1) ?? null;
}

async function fetchRepo(app) {
  const copy = await gh(`/repos/${ORG}/${app.repo}`);
  if (!copy) throw new Error('not found in the organization');
  const wanted = app.upstream.toLowerCase();
  let original = [copy.parent, copy.source, copy].find((r) => r?.full_name.toLowerCase() === wanted);
  original ??= await gh(`/repos/${app.upstream}`);
  if (!original) throw new Error(`upstream ${app.upstream} not found`);

  const release = await gh(`/repos/${original.full_name}/releases/latest`);
  const version = release?.tag_name ?? highestTag(await gh(`/repos/${original.full_name}/tags?per_page=100`));
  return {
    stars: original.stargazers_count,
    updated: original.pushed_at,
    version,
    archived: Boolean(copy.archived || original.archived),
  };
}

async function pool(items, worker) {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (queue.length) await worker(queue.shift());
    }),
  );
}

const repos = {};
let live = 0;
await pool(apps, async (app) => {
  try {
    repos[app.repo] = await fetchRepo(app);
    live += 1;
  } catch (error) {
    if (fallback[app.repo]) repos[app.repo] = fallback[app.repo];
    console.warn(`github: ${app.repo}: ${error.message} (using ${fallback[app.repo] ? 'fallback' : 'no data'})`);
  }
});

// Coverage check: organization repositories without a content entry.
try {
  const known = new Set([...apps.map((a) => a.repo), ...site.ignore].map((r) => r.toLowerCase()));
  const listed = [];
  for (let page = 1; page <= 10; page += 1) {
    const batch = await gh(`/orgs/${ORG}/repos?type=public&per_page=100&page=${page}`);
    if (!batch?.length) break;
    listed.push(...batch);
    if (batch.length < 100) break;
  }
  for (const repo of listed.filter((r) => !known.has(r.name.toLowerCase()))) {
    console.log(
      `::warning title=Repository without apps.yaml entry::${repo.full_name} is public but not on the site. ` +
        'Add it to content/apps.yaml, or to `ignore` in content/site.yaml.',
    );
  }
} catch (error) {
  console.warn(`github: coverage check skipped: ${error.message}`);
}

const sorted = Object.fromEntries(Object.entries(repos).sort(([a], [b]) => a.localeCompare(b)));
fs.mkdirSync(path.dirname(outFile), { recursive: true });
// "Last refresh" on the page only moves when live data actually arrived.
const generatedAt = live || !fallbackData.generatedAt ? new Date().toISOString() : fallbackData.generatedAt;
fs.writeFileSync(outFile, `${JSON.stringify({ generatedAt, repos: sorted }, null, 2)}\n`);
console.log(`github: wrote ${Object.keys(sorted).length} repos (${live} live, ${Object.keys(sorted).length - live} from fallback)`);
