# ✍️ Writing posts

Posts are Markdown files in git:

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
updated: 2026-11-04
tags: [notes, blogging]
thumbnail: /og-default.png
thumbnailAlt: Description of the image
featured: true
draft: false
lang: en
author: Guest Author
series: File-based blogging
seriesOrder: 1
translateOf: my-post-en.md
canonical: https://example.com/original-post
noindex: false
discussionUrl: https://example.com/discussion
---

Write the body in Markdown below the frontmatter.
```

| Field | Required | Notes |
| --- | --- | --- |
| `title` | yes | Shown as the post heading |
| `description` | recommended | Used on cards, search, and SEO |
| `date` | yes | Format `YYYY-MM-DD` |
| `updated` | no | Shown as “Updated”, and used for sitemap `lastmod` and feeds |
| `tags` | no | Array or comma-separated list |
| `thumbnail` | no | Path under `public/` or a full image URL |
| `thumbnailAlt` | no | Accessibility text for the thumbnail |
| `featured` | no | Set `true` to include the post in the featured slider |
| `draft` | no | Set `true` to exclude the post from the build |
| `lang` | no | Defaults to `en`. The language chip and translation list show a flag. `fa`, `ar`, `he`, and `ur` use a right-to-left page |
| `author` | no | Overrides the site author from `openblog.config.ts` |
| `series` | no | Groups posts on `/series/<name>` |
| `seriesOrder` | no | Reading order inside a series. Requires `series` |
| `translateOf` | no | File name of the source post in the **same** category folder |
| `canonical` | no | Absolute URL when this file republishes something that lives elsewhere |
| `noindex` | no | Builds the page, and leaves it out of the sitemap and feeds |
| `discussionUrl` | no | Link for replies. There is no comment widget |

`npm run check:posts` fails when a title or date is missing, a slug is not lowercase and hyphenated, `translateOf` is broken, or two files share a slug.

## Extra pages

Markdown files in `content/pages/` become pages such as `/now`. Give each file a `title`. `updated` is optional. Do not use a file name that matches a built-in route (`about`, `archive`, `search`, `series`, `posts`, `categories`, `tag`, `page`). Link them from `footerLinks` in `openblog.config.ts`.

## 💡 Tips

- One clear idea per post keeps the archive easy to browse.
- Run `npm run dev` and check the home page, category page, and tags before you publish.
- Commit your `.md` files with git; after you push, your host can rebuild the static site.
