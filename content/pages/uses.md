---
title: Uses
description: The small stack behind this file-based blog.
updated: 2026-11-04
---

The template stays small on purpose.

## Writing

- Markdown files in `content/posts/<category>/`
- Extra pages in `content/pages/`
- Site name, author, nav, and footer in `openblog.config.ts`

## Building

- [Astro](https://astro.build/) for the static site
- [Shiki](https://shiki.style/) for code highlighting at build time
- A browser-side filter on the Search page, with no search account

## Publishing

GitHub Pages is the included path. The `dist/` folder can also sit on any static host.
