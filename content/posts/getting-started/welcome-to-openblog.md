---
title: Welcome to OpenBlog
description: Start here — how this Markdown blog is organized, how to brand it, and how to publish your first update.
date: 2026-03-15
featured: true
lang: en
thumbnail: /og-default.png
thumbnailAlt: OpenBlog default social image
tags: [getting-started, openblog, blogging]
---

OpenBlog turns Markdown files in Git into a public blog. This repository is ready to run as your first website: sample posts, categories, tags, and pages are already in place.

## Site layout

| Path | Purpose |
| --- | --- |
| `content/posts/<category>/<post>.md` | Blog posts |
| `content/about.md` | About page |
| `openblog.config.ts` | Title, tagline, nav, colors, logos |
| `public/` | Favicon, logos, Open Graph image |

## Categories and tags

Categories come from the folder name under `content/posts/`. Tags come from each post’s frontmatter and power `/tag/...` pages.

This starter site already includes categories such as **Getting Started**, **Networking**, **Security**, **JavaScript**, **Database**, **DevOps**, **C#**, and **Blog**.

## Next steps

1. Run `npm install` and `npm run dev`
2. Edit `openblog.config.ts` with your brand
3. Replace this post or add a new file under `content/posts/`
4. Deploy with the included GitHub Pages workflow

When you are ready, open a pull request and merge to publish.
