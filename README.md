# gl-i.net: Community Apps for GL.iNet routers

A small "app store" for the projects in
[GLiNet-Community-Scripts](https://github.com/GLiNet-Community-Scripts):
what each tool does, which routers it supports and how to install it.
A static site built with [Astro](https://astro.build), deployed to GitHub
Pages at **https://gl-i.net**.

**Unofficial.** This is a community project. It is not affiliated with,
endorsed by or operated by GL.iNet. Maintained by Admon
([GL.iNet forum](https://forum.gl-inet.com/u/admon/),
[GitHub](https://github.com/admonstrator)).

## Local development

```sh
nvm use          # Node 22
npm install
npm run dev      # http://localhost:4321
npm run build    # fetches GitHub data, validates content, builds to dist/
```

## Content

All text lives in three YAML files. Changing the site never touches HTML.

- [`content/apps.yaml`](content/apps.yaml): one entry per repository
  (tagline, description, features, install command, supported models,
  caveats). The header of the file documents every field.
- [`content/categories.yaml`](content/categories.yaml): the sections and
  filter chips, in display order.
- [`content/site.yaml`](content/site.yaml): hero, disclaimer, maintainer,
  official GL.iNet links, and `ignore` for repositories that should not
  appear.

Adding a project: suggestions arrive through the
[project form](https://github.com/GLiNet-Community-Scripts/community-website/issues/new?template=new-project.yml)
(`.github/ISSUE_TEMPLATE/new-project.yml`); its fields map one to one onto
`apps.yaml`, and the pull request that adds the entry can close the issue. Fork the project into the organization, then append a block to
`apps.yaml`. Copy the install command verbatim from the project's README;
the install sheet splits long commands into lines on its own, and the copy
button always copies the original one-liner.

Tile icons (see `src/lib/icons.ts`): `router`, `shield`, `lock`, `chip`,
`signal`, `route`, `wave`, `radar`, `book`, `terminal`, `message`,
`antenna`, `usb`, `toggle`, `gauge`, `clock`, `phone`, `backup`,
`dashboard`, `satellite`, `monitor`, `chat`, `desktop`, `puzzle`, `layers`,
`vlan`, `speed`, `key`, `tailscale`, `globe`, `bug`.

**The build validates everything.** Unknown categories, icons or types,
duplicate repositories and malformed links fail with a clear message.

## GitHub data

`scripts/fetch-github.mjs` runs before every build. For each repository it
reads the original project (the fork parent, or `upstream` for mirrored
repositories), because the synced copy in the organization has no stars or
releases of its own:

- stars,
- the latest release, or else the highest version-like tag,
- the last commit (`pushed_at`), which drives "Recently updated".

It is fail-soft: if the API is unreachable, it falls back to the committed
`src/data/github-fallback.json`, so builds never break. Refresh that file
now and then by copying a fresh `src/data/github.json` over it.

The script also lists all public repositories of the organization. Each one
without an `apps.yaml` entry (and not in `ignore`) shows up as a warning in
the workflow run, so new projects don't go unnoticed.

## Deployment

GitHub Pages is published by GitHub Actions, there is no `gh-pages`
branch. `.github/workflows/deploy.yml` builds and publishes the site on
every push to `main`, every night at 04:41 UTC and on manual dispatch. `.github/workflows/ci.yml` runs the same
build on pull requests.

One-time setup:

1. **Settings → General → Default branch:** `main`. Scheduled runs only
   happen on the default branch. If a deploy stops with "not allowed to
   deploy to github-pages due to environment protection rules", allow
   `main` under Settings → Environments → github-pages.
2. **Settings → Pages:** Source **GitHub Actions**, custom domain
   `gl-i.net`, then **Enforce HTTPS** once the certificate is issued.
3. **DNS for `gl-i.net`** (apex domain):
   - `A` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`,
     `185.199.111.153`
   - `AAAA` → `2606:50c0:8000::153`, `2606:50c0:8001::153`,
     `2606:50c0:8002::153`, `2606:50c0:8003::153`
   - optional `CNAME www` → `glinet-community-scripts.github.io`
4. Recommended: verify `gl-i.net` for the organization
   (Organization settings → Pages → Add a domain) so no other account can
   claim it.

## Privacy

No cookies, no analytics, no requests to third parties at view time. Fonts
use the system stack and all icons are inline SVG. Should a web font ever
be needed, its `woff2` files go into `public/fonts/` instead of being
loaded from Google.

## Assets

- `public/og.png` (1200×630): the Open Graph / X card of the site.
- `social/github-preview.png` (1280×640): upload it under Settings →
  General → Social preview, so links to this repository get the same card.
- `public/apple-touch-icon.png` (180×180) and `public/favicon.svg`: the
  Wi-Fi mark.

The three PNGs are rendered from the real content (the tile grid shows the
most-starred apps) by `scripts/render-social.mjs`. They are committed, not
built. Regenerate them after changing the hero copy, or when the top apps
have shifted:

```sh
npm i --no-save playwright && npx playwright install chromium
node scripts/render-social.mjs
```
