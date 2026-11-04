# Pages

[All guides](README.md) · [Start](start.md) · [Brand](brand.md) · [Posts](posts.md) · **Pages** · [Publish](publish.md) · [Layout](layout.md)

The About page and the extra footer pages are Markdown files. They are not posts, they have no category, and they do not use the [post fields](posts.md#all-fields).

On this page: [About](#about) · [Extra pages](#extra-pages) · [Reserved names](#reserved-names)

## About

Edit [`content/about.md`](../content/about.md). The site serves it at `/about`.

The path is `aboutMarkdownPath` in [`openblog.config.ts`](../openblog.config.ts). The default is `content/about.md`. Changing the path is described in [Brand → Config file](brand.md#config-file).

```md
# About

A short introduction to this blog.

## Elsewhere

Where else to find the author.
```

The browser tab title is `About |` plus the site title from config. The heading on the page is the first Markdown heading in the file. Frontmatter in this file is removed before render, so put the visible title in the Markdown.

The header link to About is one of the default `nav` items. See [Brand → Navigation and footer](brand.md#navigation-and-footer).

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

Write the page here. Start with a paragraph.

## This month

A section is fine. Skip a top-level heading, because the page title already comes from `title`.
```

| Field | Required | Default | What it does |
| --- | --- | --- | --- |
| `title` | no | The file name, with hyphens turned into words | Page heading and browser title |
| `description` | no | empty | Page summary under the heading |
| `updated` | no | omitted | `YYYY-MM-DD`. Stored as the page modified date |

This repo ships `now.md`, `colophon.md`, and `uses.md`. Copy that shape for a new page.

Show the page in the footer with `footerLinks`. The label is what readers see. The `href` is the site path, which matches the file name.

```ts
footerLinks: [
  { label: 'Now', href: '/now' }
]
```

That setting lives in [`openblog.config.ts`](../openblog.config.ts). The other footer fields are in [Brand → Navigation and footer](brand.md#navigation-and-footer).

## Reserved names

The file name must be lowercase words and hyphens. These names are already routes, so a file in `content/pages/` cannot use them:

`about`, `archive`, `search`, `posts`, `categories`, `tag`, `page`, `series`, `index`

Those routes are listed with their sources in [Layout → Routes](layout.md#routes). `npm run check:posts` rejects a reserved name, a bad slug, and a duplicate page. The same command checks posts. See [Posts → Check before you publish](posts.md#check-before-you-publish).

[← Posts](posts.md) · [All guides](README.md) · [Publish →](publish.md)
