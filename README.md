<p align="center">
  <img src="public/openblog-logo-light.png" alt="OpenBlog" width="160" />
</p>

<h1 align="center">OpenBlog</h1>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="MIT License" /></a>
  <a href="https://astro.build/"><img src="https://img.shields.io/badge/Built%20with-Astro-ff5d01" alt="Built with Astro" /></a>
</p>

<p align="center">
  <strong>A free, open-source blog powered by Markdown files in git.</strong><br />
  Brand it, write posts as <code>.md</code> files, and publish a static site — MIT licensed.
</p>

<p align="center">
  🏠 Project site: <a href="https://hajiparvaneh.github.io/openblog/">hajiparvaneh.github.io/openblog</a>
</p>

---

## ✨ Features

- 📝 **Markdown posts** stored as files in your git repo
- 📁 **Categories** from folders, **tags** from frontmatter, **series** and a year **archive**
- 🔍 **Search** that filters posts in the browser
- 🌐 **RSS, Atom, and JSON** feeds generated at build time
- 🔤 Linked **translations**, reading time, table of contents, and syntax highlighting
- 🏠 Home page with featured posts, extra Markdown pages, and About
- 🌓 Light / dark theme
- 🎨 Branding, author, and content license from `openblog.config.ts` + `public/`
- 📦 Static build — no accounts, database, or API secrets required
- 📄 **MIT** license for the code

> **Two surfaces:**  
> • **This repo** — cloneable Markdown blog template (GitHub → **Use this template**).  
> • **[GitHub Pages](https://hajiparvaneh.github.io/openblog/)** — project landing for OpenBlog (features / get started).

## 📋 Requirements

- [Node.js](https://nodejs.org/) 22 or newer
- [git](https://git-scm.com/)

## 🚀 Quick start

On GitHub, click **Use this template** → **Create a new repository**, then:

```bash
git clone https://github.com/<you>/<your-blog>.git my-blog
cd my-blog
npm install
npm run dev
```

Or clone this repo directly:

```bash
git clone https://github.com/hajiparvaneh/openblog.git my-blog
cd my-blog
npm install
npm run dev
```

Open the local URL shown in the terminal (usually `http://localhost:4321`).

## 🎨 Brand your blog

1. Edit [`openblog.config.ts`](openblog.config.ts) — title, tagline, author, colors, navigation, footer, content license, and asset paths.
2. Replace images under [`public/`](public/) (logo, favicon, social image).
3. Update [`content/about.md`](content/about.md).

You usually do not need to edit layouts for a normal site.

## ✍️ Write a post

Posts are plain Markdown files in git:

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

Series, translations, `updated`, `canonical`, `noindex`, and `discussionUrl` are optional. The full list is in [POSTS-README.md](POSTS-README.md).

Commit and push when you are ready — your git history *is* your editorial history.

## 🌍 Publish the site

OpenBlog builds a **static** site in `dist/`. Host that folder anywhere that serves static files.

This repo includes a workflow for **GitHub Pages** as one easy option:

1. Push your git repository to a remote.
2. If you use GitHub: **Settings → Pages → GitHub Actions**.
3. Push to `main` (or run the workflow manually).

Default GitHub Pages URL for **your** clone (the blog):

```text
https://<your-username>.github.io/<your-repo>/
```

[hajiparvaneh.github.io/openblog](https://hajiparvaneh.github.io/openblog/) shows the **project landing page** because the workflow turns that page on only for `hajiparvaneh/openblog`. A repository created with **Use this template** (or a fork) builds the normal blog home.

### Custom domain or project path

Optional repository variables:

| Variable | When to use | Example |
| --- | --- | --- |
| `OPENBLOG_BASE_URL` | Site origin only | `https://blog.example.com/` or `https://you.github.io/` |
| `OPENBLOG_BASE_PATH` | Path under that origin | `/` for a root/custom domain, or `/your-repo` for a project path |

Do not put the same path in both variables.

Preview a production build locally:

```bash
OPENBLOG_BASE_URL=https://example.com/ OPENBLOG_BASE_PATH=/ npm run build
npm run preview
```

## 📂 Project layout

```text
content/
  about.md                 About page
  pages/*.md               Extra pages (Now, Colophon, Uses, …)
  posts/<category>/*.md    Blog posts (in git)
openblog.config.ts         Site title, author, nav, footer, license
public/                    Logos, favicon, images
src/                       Site theme and pages
```

## 🛠️ Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Local development server |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Preview the production build |
| `npm run check` | Type / Astro checks, then the post checker |
| `npm run check:posts` | Check titles, dates, slugs, translations, and extra pages |

## 📜 License

[MIT](LICENSE) — free to use, modify, and share.
