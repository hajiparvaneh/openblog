# Pages

The About page and the extra footer pages are Markdown files. They are not posts and do not use a category folder.

## About

Edit [`content/about.md`](../content/about.md). The site serves it at `/about`.

The path is set by `aboutMarkdownPath` in [`openblog.config.ts`](../openblog.config.ts). The default is `content/about.md`.

The browser tab title is `About |` plus the site title from config. The heading on the page is the first Markdown heading in the file. Frontmatter in this file is removed before render, so put the visible title in the Markdown.

## Extra pages

Add a file in [`content/pages/`](../content/pages/):

```text
content/pages/now.md
```

That file is served at `/now`.

```md
---
title: Now
description: What this site is for right now.
updated: 2026-11-04
---

Write the page here.
```

| Field | Required | Default | What it does |
| --- | --- | --- | --- |
| `title` | no | The file name, with hyphens turned into words | Page heading and browser title. The body does not need its own top heading |
| `description` | no | empty | Page summary |
| `updated` | no | omitted | `YYYY-MM-DD`. Used when the page has a modified date |

Link the page from the footer with `footerLinks`:

```ts
footerLinks: [
  { label: 'Now', href: '/now' }
]
```

## Names you cannot use

The file name must be lowercase words and hyphens. These names are already routes, so do not use them:

`about`, `archive`, `search`, `posts`, `categories`, `tag`, `page`, `series`, `index`

`npm run check:posts` checks these pages as well as posts.
