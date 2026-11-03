# Writing posts

Posts are Markdown files:

```text
content/posts/<category>/<post-name>.md
```

The **category** is the folder name (use lowercase words separated by hyphens, for example `getting-started`).

## Frontmatter

```md
---
title: My post
description: One-line summary for cards and search results.
date: 2026-03-15
tags: [notes, blogging]
thumbnail: /og-default.png
thumbnailAlt: Description of the image
featured: true
draft: false
lang: en
---

Write the body in Markdown below the frontmatter.
```

| Field | Required | Notes |
| --- | --- | --- |
| `title` | yes | Shown as the post heading |
| `description` | recommended | Used on cards and for SEO |
| `date` | yes | Format `YYYY-MM-DD` |
| `tags` | no | Array or comma-separated list |
| `thumbnail` | no | Path under `public/` or a full image URL |
| `thumbnailAlt` | no | Accessibility text for the thumbnail |
| `featured` | no | Set `true` to include the post in the featured slider |
| `draft` | no | Set `true` to exclude the post from the build |
| `lang` | no | Defaults to `en` |

## Tips

- One clear idea per post keeps the archive easy to browse.
- Run `npm run dev` and check the home page, category page, and tags before you publish.
- After you push to `main`, GitHub Pages rebuilds the site automatically.
