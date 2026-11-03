# OpenBlog

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Built with Astro](https://img.shields.io/badge/Built%20with-Astro-ff5d01)](https://astro.build/)

A free Markdown blog template for a **reader-facing** site: **clone → brand → write → publish**.  
The live UI is aimed at blog readers (posts, categories, tags, about). Publisher setup stays in this README.  
No scoring. No leaderboard. No secrets required to build.

Live preview example: [openblog.cc](https://openblog.cc) ([preview repo](https://github.com/hajiparvaneh/openblogcc))

## Quickstart

### 1. Create your repo

Use **Use this template** on GitHub (enable Template repository in Settings if you maintain upstream), or clone this repository.

### 2. Run locally

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:4321`).

Requires Node.js 22+.

### 3. Brand the site

Edit `openblog.config.ts` and replace logos/icons under `public/` (see paths in the config).  
Edit About content in `content/about.md`. Sample posts under `content/posts/` already fill categories and tags so the first deploy looks like a real site.

### 4. Write a post

Add:

`content/posts/<category>/<post>.md`

```md
---
title: My post
description: One-line summary.
date: 2026-11-03
tags: [notes]
---

Write in Markdown.
```

### 5. Deploy with GitHub Pages

1. **Settings → Pages → Build and deployment → GitHub Actions**
2. Push to `main`
3. Site URL defaults to `https://<user>.github.io/<repo>/`

For a custom domain / root site, set repository variables:

| Variable | Example |
| --- | --- |
| `OPENBLOG_BASE_URL` | `https://blog.example.com/` (origin only) |
| `OPENBLOG_BASE_PATH` | `/` |

Do not put the repo path in both variables.

```bash
OPENBLOG_BASE_URL=https://you.github.io/ OPENBLOG_BASE_PATH=/your-repo npm run build
npm run preview
```

### 6. Publish by merging a PR

Branch → edit Markdown → open PR → merge to `main` → Pages redeploys.

## What this is / isn’t

| This template | Preview site (`openblogcc`) |
| --- | --- |
| Your personal/project blog | Example deployment at openblog.cc |
| Static Markdown site | May include extra demo-only features |
| No Worker / OAuth / points | Separate repository |

## License

[MIT](LICENSE)
