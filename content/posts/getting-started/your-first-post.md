---
title: Write your first post
description: A practical checklist for adding a Markdown post with title, description, date, tags, and optional thumbnail.
date: 2026-03-14
lang: en
thumbnail: /og-default.png
thumbnailAlt: OpenBlog default social image
tags: [getting-started, writing, markdown]
---

Every post is a Markdown file with YAML frontmatter at the top.

## Minimal frontmatter

```md
---
title: My post title
description: One-line summary for cards and SEO.
date: 2026-03-14
tags: [notes, tutorial]
---

Your content starts here.
```

## Useful optional fields

| Field | Example | Effect |
| --- | --- | --- |
| `featured` | `true` | Shows in the featured slider |
| `thumbnail` | `/og-default.png` or a full image URL | Card and social preview image |
| `thumbnailAlt` | Short alt text | Accessibility for the image |
| `lang` | `en` | Language badge when not English |
| `draft` | `true` | Hides the post from the build |

## File location

Put the file here:

```text
content/posts/<category>/<slug>.md
```

Examples:

- `content/posts/networking/how-dns-works.md`
- `content/posts/javascript/async-await-error-handling.md`

The category folder becomes the category label on the site. The file name (without `.md`) becomes part of the post URL.

## After you write

1. Check the post locally with `npm run dev`
2. Confirm the category and tag pages look right
3. Commit, open a PR, and merge to publish
