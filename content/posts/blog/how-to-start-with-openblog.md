---
title: "How to start with OpenBlog"
description: Clone this template, brand your site, publish Markdown posts with pull requests, and ship a free static blog on GitHub Pages.
date: 2026-03-13
featured: true
lang: en
thumbnail: /og-default.png
thumbnailAlt: OpenBlog default social image
tags: [openblog, github, blogging, how-to, portfolio]
---

OpenBlog is a free Markdown blogging template for developers and technical writers. You write in Git, review changes in pull requests, and publish a static site.

## Why use it

- Free hosting path via GitHub Pages
- Posts stay versioned next to your code history
- Branding lives in one config file
- No accounts or API secrets required to build

## First-hour setup

1. Use this repository as a GitHub template (or clone it)
2. Run `npm install` and `npm run dev`
3. Update `openblog.config.ts` (title, tagline, logos, nav)
4. Edit `content/about.md`
5. Add or replace posts under `content/posts/`

## Publish

Enable GitHub Pages with the included Actions workflow. For project Pages, set:

- `OPENBLOG_BASE_URL` to your origin (for example `https://you.github.io/`)
- `OPENBLOG_BASE_PATH` to your repo path (for example `/openblog`)

Then merge to `main` and the site rebuilds.

## Grow in public

Treat each post as portfolio evidence. Improve explanations, add examples, and keep a clean archive readers can browse by category and tag.
