# Posts

Add one Markdown file per post. The folder name is the category. The file name is the slug.

```text
content/posts/<category>/<post-name>.md
```

Use lowercase words and hyphens for both names, for example `content/posts/notes/my-first-post.md`. The post URL is `/posts/notes/my-first-post`. One folder deep is the only supported layout.

## Minimum post

```md
---
title: My first post
description: A short summary for cards and search.
date: 2026-03-15
tags: [notes, blogging]
---

Write the post here.
```

`title` and `date` are required. `date` is `YYYY-MM-DD`. `description` is optional and is used on cards, search, and the page summary.

## All fields

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
```

| Field | Required | Default | What it does |
| --- | --- | --- | --- |
| `title` | yes | | Post heading |
| `description` | no | empty | Card text, search text, and the page summary |
| `date` | yes | | Publish date, `YYYY-MM-DD`. Newer dates appear first |
| `updated` | no | omitted | Shown as “Updated”. Also used for sitemap and feed dates |
| `tags` | no | none | A list, or a comma-separated string. Each tag gets a page |
| `thumbnail` | no | none | Path in `public/`, such as `/cover.png`, or an `http(s)` image URL |
| `thumbnailAlt` | no | the title | Alt text for the thumbnail |
| `featured` | no | `false` | `true` includes the post in the featured slider |
| `draft` | no | `false` | `true` hides the post from the site |
| `lang` | no | `en` | Language code such as `en`, `fr`, or `es`. Shown with a flag |
| `author` | no | the site author | Replaces the byline from `openblog.config.ts` for this post |
| `series` | no | none | Groups this post with others that use the same name |
| `seriesOrder` | no | none | Number that sets the reading order. Requires `series` |
| `translateOf` | no | none | File name of the original post in the same category folder |
| `canonical` | no | this page | Absolute `http(s)` URL when the original lives somewhere else |
| `noindex` | no | `false` | `true` still builds the page and leaves it out of the sitemap and feeds |
| `discussionUrl` | no | none | Absolute `http(s)` link shown as “Discuss this post” |

`seriesOrder` must be a number, and two posts in the same series cannot share one. The checker also accepts `order` as another name for `seriesOrder`.

## Series

Give related posts the same `series` name and a `seriesOrder`.

```md
---
title: Write a post
series: File-based blogging
seriesOrder: 1
---
```

Readers open the series at `/series` and at `/series/<slug>`. The slug comes from the series name (`File-based blogging` becomes `file-based-blogging`). Parts are ordered by `seriesOrder`, then by date. A post page shows the part number and links to the previous and next parts.

## Translations

Keep every language in the same category folder. Point each translation at the original file name.

```md
---
title: Bienvenue
lang: fr
translateOf: welcome.md
---
```

`translateOf` is a file name such as `welcome.md`, not a path. The file must exist in the same folder, and it cannot be a draft or the same file. The post page lists the languages in the group. `fa`, `ar`, `he`, and `ur` set the page direction to right-to-left.

## Body

Write Markdown under the frontmatter.

- `##` and `###` headings are included in the table of contents and get link ids.
- A fenced code block with a language name is highlighted. An unknown language is shown as plain text.
- Reading time is about one minute per 200 words, with a minimum of one minute.
- Up to three related posts are chosen from shared tags, then from the same category. Translations of the same post are skipped.

## Check before you publish

```bash
npm run check:posts
```

The command fails when a title or date is missing, a slug is not lowercase and hyphenated, `translateOf` is broken, `canonical` or `discussionUrl` is not an absolute `http(s)` URL, or two files share a slug.

Commit the Markdown file. The git history is the editorial history.
