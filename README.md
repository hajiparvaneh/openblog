# OpenBlog

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Built with Astro](https://img.shields.io/badge/Built%20with-Astro-ff5d01)](https://astro.build/)

**OpenBlog** is a free, open-source blog template. Write posts as Markdown files, brand the site from one config file, and publish a static site with GitHub Pages.

Demo: [openblog.cc](https://openblog.cc)

## Features

- Markdown posts in Git (`content/posts/`)
- Categories from folders, tags from frontmatter
- Home page with featured posts, archive, and About page
- Light / dark theme
- Config-first branding (`openblog.config.ts` + `public/`)
- Static build — no accounts or API secrets required
- MIT license

## Requirements

- [Node.js](https://nodejs.org/) 22 or newer
- A GitHub account (optional, for GitHub Pages)

## Quick start

```bash
git clone https://github.com/hajiparvaneh/openblog.git my-blog
cd my-blog
npm install
npm run dev
```

Open the local URL shown in the terminal (usually `http://localhost:4321`).

Or click **Use this template** on GitHub to create your own repository.

## Brand your blog

1. Edit [`openblog.config.ts`](openblog.config.ts) — title, tagline, colors, navigation, footer, and asset paths.
2. Replace images under [`public/`](public/) (logo, favicon, social image).
3. Update [`content/about.md`](content/about.md).

You usually do not need to edit layouts for a normal site.

## Write a post

Create a file:

```text
content/posts/<category>/<post-name>.md
```

Example:

```md
---
title: My first post
description: A short summary for cards and SEO.
date: 2026-03-15
tags: [notes, blogging]
featured: true
---

Your content in Markdown.
```

| Field | Required | Description |
| --- | --- | --- |
| `title` | yes | Post title |
| `description` | recommended | Short summary |
| `date` | yes | `YYYY-MM-DD` |
| `tags` | no | List of tags |
| `thumbnail` | no | Image path or URL |
| `thumbnailAlt` | no | Alt text for the image |
| `featured` | no | Show in the featured slider |
| `draft` | no | Hide from the site when `true` |
| `lang` | no | Language code (default `en`) |

More detail: [POSTS-README.md](POSTS-README.md)

## Deploy to GitHub Pages

1. Push your repository to GitHub.
2. Open **Settings → Pages**.
3. Under **Build and deployment**, choose **GitHub Actions**.
4. Push to `main` (or run the workflow manually).

Default site URL:

```text
https://<your-username>.github.io/<your-repo>/
```

### Custom domain or project path

Set these **repository variables** (Settings → Secrets and variables → Actions → Variables) if needed:

| Variable | When to use | Example |
| --- | --- | --- |
| `OPENBLOG_BASE_URL` | Site origin only | `https://blog.example.com/` or `https://you.github.io/` |
| `OPENBLOG_BASE_PATH` | Path under that origin | `/` for a custom domain, or `/your-repo` for project Pages |

Do not put the same path in both variables.

Preview a production build locally:

```bash
OPENBLOG_BASE_URL=https://you.github.io/ OPENBLOG_BASE_PATH=/your-repo npm run build
npm run preview
```

## Project layout

```text
content/
  about.md                 About page
  posts/<category>/*.md    Blog posts
openblog.config.ts         Site title, nav, branding paths
public/                    Logos, favicon, images
src/                       Site theme and pages
.github/workflows/         GitHub Pages deploy
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Local development server |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Preview the production build |
| `npm run check` | Type / Astro checks |

## License

[MIT](LICENSE) — free to use, modify, and share.
