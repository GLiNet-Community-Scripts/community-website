#!/usr/bin/env node
/*
 * Does the deployed site still show the right bars?
 *
 *   npx astro build && node scripts/check-notices.mjs
 *
 * Run every 30 minutes by .github/workflows/notices-watch.yml. Compares
 * dist/notices.json (what a build would publish right now) with the deployed
 * /notices.json. They differ when a bar's time is up (banner_until, the 48
 * hours of a "Resolved" bar, a notice's until) or a notice's "from" has come,
 * and whenever a change has not been deployed yet. Writes changed=true|false
 * to $GITHUB_OUTPUT; an unreadable live site counts as no change.
 */
import fs from 'node:fs';
import YAML from 'yaml';

const site = YAML.parse(fs.readFileSync('content/site.yaml', 'utf8')).url;
const key = (n) => [n.kind, n.id, n.level, n.text, n.url, n.updated, n.until ?? ''].join('\u0001');
const want = JSON.parse(fs.readFileSync('dist/notices.json', 'utf8')).notices.map(key);

let have = null;
const live = new URL(`/notices.json?t=${Date.now()}`, site);
try {
  const res = await fetch(live, { headers: { 'cache-control': 'no-cache' } });
  if (res.ok) have = (await res.json()).notices.map(key);
  else console.log(`${live}: HTTP ${res.status}`);
} catch (e) {
  console.log(`${live}: ${e.message}`);
}

const changed = have !== null && JSON.stringify(want) !== JSON.stringify(have);
console.log(`build now: ${want.length} notice(s), deployed: ${have?.length ?? '?'}, changed: ${changed}`);
if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `changed=${changed}\n`);
