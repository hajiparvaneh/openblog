---
title: Your posts are Markdown files on GitHub
description: OpenBlog is file-based — each article is a .md file in the repository, versioned on GitHub, and turned into pages when the site builds.
date: 2026-03-14
featured: true
discussionUrl: https://github.com/hajiparvaneh/openblog/discussions
lang: en
thumbnail: /og-default.png
thumbnailAlt: OpenBlog default social image
tags: [openblog, markdown, github, files]
---

OpenBlog is a **file-based** blog. There is no database of posts hiding behind an admin panel. Each article is a Markdown (`.md`) file you can open, edit, and review like any other file in a project.

## How a post is stored

Posts live under folders such as:

```text
content/posts/blog/welcome-to-openblog.md
```

The folder name becomes the **category**. Tags and other details sit in a short frontmatter block at the top of the file.

## Why GitHub fits

Because posts are files, GitHub becomes the place where history, reviews, and backups already live. You write a Markdown file, commit it, and the site rebuilds into static pages readers can open in a browser.

No special editor is required — any text editor that can save `.md` files works.
