---
title: Publish the static site
description: Build the Markdown into HTML, then host the dist folder. GitHub Pages is the path included with the template.
date: 2026-03-12
series: File-based blogging
seriesOrder: 2
tags: [openblog, github, series]
---

When the files look right, the site is a folder of HTML. There is no database to migrate and no account to create.

## Build

```bash
npm run build
npm run preview
```

The build writes `dist/`. Any host that can serve static files can publish that folder.

## GitHub Pages

Push the repository and set Pages to GitHub Actions. The workflow in this template builds on every push to `main`.

Readers can follow new posts from `/rss.xml`, `/atom.xml`, or `/feed.json` without signing in.
