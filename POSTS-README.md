# Writing Posts For OpenBlog

Create posts in:

`content/posts/<category>/<post-file>.md`

Example:

`content/posts/networking/how-dns-works.md`

## Frontmatter

Required metadata:

- `title`: post title
- `description`: short summary for cards and SEO
- `date`: publish date in `YYYY-MM-DD`

Optional metadata:

- `thumbnail`: external image URL (recommended absolute `https://...`)
- `thumbnailAlt`: alt text for `thumbnail`
- `tags`: human-written tags, comma-separated string or YAML array
- `draft`: `true` or `false` (default: `false`)
- `featured`: `true` or `false` (default: `false`)
- `lang`: language code (default: `en`)
- `translateOf`: relative `.md` file path to the source post in the same folder

Rules for `translateOf`:

- Must point to a `.md` file
- Must stay in the same category folder
- Must not point to itself

## Recommended Template

```md
---
title: How DNS Works
description: Learn how DNS converts domain names into IP addresses.
date: 2026-03-16

thumbnail: https://images.example.com/dns-hero.jpg
thumbnailAlt: DNS map illustration
tags: nextjs, networking, dns
featured: false
lang: en
# draft: true
# translateOf: how-dns-works-fa.md
---

Intro paragraph.

## Main section

Add practical examples, trusted references, and clear explanations.
```

## Behavior Notes

- `draft: true` posts are not published on the site.
- `featured: true` shows a featured badge in cards and post detail.
- `tags` are safely normalized to an array in code.
- `lang` is shown on post detail and on cards when not `en`.
- `thumbnail` is shown at the top of post cards and post detail pages.
