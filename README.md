# GL.iNet Community Apps

A small "app store" for the projects in
[GLiNet-Community-Scripts](https://github.com/GLiNet-Community-Scripts):
what each tool does, which routers it supports and how to install it.
Unofficial and community-maintained, not affiliated with GL.iNet.

## Status: mockup

- [`mockup/index.html`](mockup/index.html): a single self-contained page
  with real data from all public repositories (snapshot of 1 Oct 2026).
  Open it in a browser, no build step needed.
- [`content/apps.yaml`](content/apps.yaml): the curated texts behind it
  (tagline, description, features, install command, supported models,
  caveats), extracted from each project's README. Needs a review pass.

## Planned build

Same approach as [apps.admon.me](https://github.com/admonstrator/apps-admon-me-website):

- Static site built with Astro, deployed to GitHub Pages.
- `content/apps.yaml` is the only hand-edited content. The build validates
  it: unknown categories, missing repositories or icons fail with a clear
  message.
- A scheduled GitHub Action rebuilds the site every night and pulls stars,
  the latest release (or tag) and the last update for every repository from
  the GitHub API. Stars and "Recently updated" come from the original
  repository, not from the synced copy in the organization. New repositories in the organization without a YAML entry
  are reported, so nothing appears without a reviewed description.
- Privacy: no cookies, no analytics, no requests to third parties at view
  time. Fonts use the system stack; should a web font ever be needed, the
  `woff2` files live in this repository instead of being loaded from Google.
