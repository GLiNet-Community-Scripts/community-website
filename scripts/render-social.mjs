#!/usr/bin/env node
/*
 * Renders the social preview images from the real content: the tile grid
 * shows the most-starred community apps with their icons and colours.
 *
 *   public/og.png                 1200×630  Open Graph / X card of the site
 *   public/apple-touch-icon.png    180×180  home-screen and link-preview icon
 *   social/github-preview.png     1280×640  Settings → Social preview on GitHub
 *
 * Not part of the build. Run it after changing the hero copy or when the
 * top apps have shifted (Node 22.18+ for the .ts imports):
 *
 *   npm i --no-save playwright && npx playwright install chromium
 *   node scripts/render-social.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { chromium } from 'playwright';
import { ICONS } from '../src/lib/icons.ts';
import { gradientFor } from '../src/lib/tiles.ts';

const root = process.cwd();
const apps = YAML.parse(fs.readFileSync(path.join(root, 'content', 'apps.yaml'), 'utf8'));
const dataFile = ['github.json', 'github-fallback.json']
  .map((f) => path.join(root, 'src', 'data', f))
  .find((f) => fs.existsSync(f));
const github = dataFile ? JSON.parse(fs.readFileSync(dataFile, 'utf8')).repos : {};

// Same colour assignment as the site: per category, in apps.yaml order.
const perCategory = {};
const tools = apps
  .map((app) => {
    const n = perCategory[app.category] ?? 0;
    perCategory[app.category] = n + 1;
    return { ...app, gradient: gradientFor(app.category, n), stars: github[app.repo]?.stars ?? 0 };
  })
  .filter((app) => app.kind === 'tool')
  .sort((a, b) => b.stars - a.stars);

// Nine tiles, one per icon, so the grid doesn't repeat itself.
const seen = new Set();
const tiles = tools.filter((app) => !seen.has(app.icon) && seen.add(app.icon)).slice(0, 9);

const LOGO =
  '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M4.5 10.5a10.6 10.6 0 0 1 15 0"/><path d="M7.6 13.6a6.2 6.2 0 0 1 8.8 0"/><circle cx="12" cy="17.2" r="1.4" fill="#fff" stroke="none"/></svg>';

function card(width, height) {
  const s = height / 630; // everything is drawn for 630 px height and scaled
  const tileHtml = tiles
    .map(
      (t) =>
        `<div class="t" style="background:linear-gradient(160deg,${t.gradient[0]},${t.gradient[1]})"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[t.icon]}</svg></div>`,
    )
    .join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box}
    html,body{margin:0;width:${width}px;height:${height}px;overflow:hidden}
    body{position:relative;background:#0f231a;color:#f1f7f3;
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Liberation Sans',Arial,sans-serif}
    .glow{position:absolute;right:${-120 * s}px;top:${-190 * s}px;width:${760 * s}px;height:${760 * s}px;border-radius:50%;
      background:radial-gradient(circle,#2c6b51 0%,rgba(44,107,81,0) 66%)}
    .left{position:absolute;left:${80 * s}px;top:${70 * s}px;bottom:${70 * s}px;width:${640 * s}px;display:flex;flex-direction:column}
    .brand{display:flex;align-items:center;gap:${18 * s}px}
    .logo{width:${64 * s}px;height:${64 * s}px;border-radius:${17 * s}px;background:#1f4d3a;display:grid;place-items:center;
      box-shadow:inset 0 0 0 1px rgba(255,255,255,.14)}
    .logo svg{width:${40 * s}px;height:${40 * s}px}
    .brand b{display:block;font-size:${28 * s}px;letter-spacing:-.01em}
    .brand span{display:block;font-size:${20 * s}px;color:#9cc7b2;margin-top:${2 * s}px}
    h1{margin:${58 * s}px 0 0;font-size:${70 * s}px;line-height:1.04;letter-spacing:-.035em}
    p{margin:${20 * s}px 0 0;font-size:${26 * s}px;line-height:1.35;color:#b9d3c6;max-width:${560 * s}px}
    .foot{margin-top:auto;font-size:${21 * s}px;color:#9cc7b2}
    .foot b{color:#f1f7f3;margin-right:${14 * s}px}
    .grid{position:absolute;right:${92 * s}px;top:50%;display:grid;grid-template-columns:repeat(3,${96 * s}px);gap:${22 * s}px;
      transform:translateY(-54%) rotate(-8deg)}
    .t{width:${96 * s}px;height:${96 * s}px;border-radius:22.5%;display:grid;place-items:center;
      box-shadow:inset 0 0 0 1px rgba(255,255,255,.12),0 ${10 * s}px ${30 * s}px rgba(0,0,0,.35)}
    .t svg{width:${50 * s}px;height:${50 * s}px}
  </style></head><body>
    <div class="glow"></div>
    <div class="left">
      <div class="brand"><div class="logo">${LOGO}</div><div><b>Community Apps</b><span>Unofficial · for GL.iNet routers</span></div></div>
      <h1>Apps for your<br>GL.iNet router.</h1>
      <p>Scripts, add-ons and companion tools, built by the community.</p>
      <div class="foot"><b>gl-i.net</b>Community project, not affiliated with GL.iNet</div>
    </div>
    <div class="grid">${tileHtml}</div>
  </body></html>`;
}

function icon(size) {
  return `<!doctype html><html><head><style>html,body{margin:0;width:${size}px;height:${size}px;background:#1f4d3a}
    body{display:grid;place-items:center}svg{width:${size * 0.66}px;height:${size * 0.66}px}</style></head>
    <body>${LOGO}</body></html>`;
}

const outputs = [
  { file: 'public/og.png', width: 1200, height: 630, html: card(1200, 630) },
  { file: 'social/github-preview.png', width: 1280, height: 640, html: card(1280, 640) },
  { file: 'public/apple-touch-icon.png', width: 180, height: 180, html: icon(180) },
];

const browser = await chromium.launch();
for (const out of outputs) {
  const page = await browser.newPage({ viewport: { width: out.width, height: out.height } });
  await page.setContent(out.html);
  const file = path.join(root, out.file);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await page.screenshot({ path: file });
  await page.close();
  console.log(`social: ${out.file} (${out.width}×${out.height}, ${Math.round(fs.statSync(file).size / 1024)} KB)`);
}
await browser.close();
