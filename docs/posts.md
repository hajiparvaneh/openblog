# Posts

[All guides](README.md) · [Start](start.md) · [Brand](brand.md) · **Posts** · [Pages](pages.md) · [Publish](publish.md) · [Layout](layout.md)

Add one Markdown file per post. The folder name is the category. The file name is the slug.

On this page: [File name](#file-name) · [Minimum post](#minimum-post) · [All fields](#all-fields) · [Series](#series) · [Translations](#translations) · [Body](#body) · [Check before you publish](#check-before-you-publish)

## File name

```text
content/posts/<category>/<post-name>.md
```

Use lowercase words and hyphens for both names. `content/posts/notes/my-first-post.md` is served at `/posts/notes/my-first-post`. One folder deep is the only supported layout. The route table is in [Layout](layout.md#routes).

Pages that are not posts, such as About and Now, do not go in this folder. See [Pages](pages.md).

## Minimum post

`title` and `date` are required. `date` is `YYYY-MM-DD`.

```md
---
title: My first post
description: A short summary for cards and search.
date: 2026-03-15
tags: [notes, blogging]
---

Write the post here.
```

`description` is optional. It is used on cards, in search, and as the page summary. After the file is saved, `npm run dev` from [Start](start.md#commands) reloads the local site.

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
| `date` | yes | | Publish date, `YYYY-MM-DD`. Newer dates appear first on the home page and in the [archive](layout.md#routes) |
| `updated` | no | omitted | Shown as “Updated”. Also used for sitemap and [feed](publish.md#feeds-and-sitemap) dates |
| `tags` | no | none | A list, or a comma-separated string. Each tag gets a page at `/tag/<tag>` |
| `thumbnail` | no | none | Path in [`public/`](brand.md#images), such as `/cover.png`, or an `http(s)` image URL |
| `thumbnailAlt` | no | the title | Alt text for the thumbnail |
| `featured` | no | `false` | `true` includes the post in the home page slider |
| `draft` | no | `false` | `true` hides the post from the site, the sitemap, and the feeds |
| `lang` | no | `en` | Language code such as `en`, `fr`, or `es`. Shown with a flag |
| `author` | no | [site author](brand.md#config-file) | Replaces the byline from `openblog.config.ts` for this post |
| `series` | no | none | Groups this post with others that use the same name. See [Series](#series) |
| `seriesOrder` | no | none | Number that sets the reading order. Requires `series` |
| `translateOf` | no | none | File name of the original post in the same category folder. See [Translations](#translations) |
| `canonical` | no | this page | Absolute `http(s)` URL when the original lives somewhere else |
| `noindex` | no | `false` | `true` still builds the page and leaves it out of the sitemap and feeds |
| `discussionUrl` | no | none | Absolute `http(s)` link shown as “Discuss this post”. There is no comment form |

`seriesOrder` must be a number, and two posts in the same series cannot share one. The checker also accepts `order` as another name for `seriesOrder`.

Search matches the title, description, category, series name, language, and tags. It runs in the browser. The page is `/search`.

## Series

Give related posts the same `series` name and a `seriesOrder`.

```md
---
title: Write a post
date: 2026-03-11
series: File-based blogging
seriesOrder: 1
---
```

```md
---
title: Publish the site
date: 2026-03-12
series: File-based blogging
seriesOrder: 2
---
```

Readers open every series at `/series`, and one series at `/series/<slug>`. The slug comes from the series name (`File-based blogging` becomes `file-based-blogging`). Parts are ordered by `seriesOrder`, then by date. A post page shows the part number and links to the previous and next parts.

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

- `##` and `###` headings are included in the table of contents and get link ids. Other heading levels stay in the article and are left out of the contents.
- A fenced code block with a language name is highlighted. An unknown language is shown as plain text.
- Reading time is about one minute per 200 words, with a minimum of one minute.
- Up to three related posts are chosen from shared tags, then from the same category. Translations of the same post are skipped.

## Check before you publish

```bash
npm run check:posts
```

The command fails when:

- `title` is missing, or `date` or `updated` is not `YYYY-MM-DD`
- the category or file name is not lowercase words and hyphens
- two posts share a slug
- `seriesOrder` is set without `series`, is not a number, or repeats inside one series
- `translateOf` is not a file name in the same folder, points at a draft, or points at itself
- `canonical` or `discussionUrl` is set and is not an absolute `http(s)` URL
- `lang` is not a language code, or `noindex` is not `true` or `false`

The same command checks [extra pages](pages.md#reserved-names). Commit the Markdown file when the check passes. The git history is the editorial history. Shipping the built site is covered in [Publish](publish.md).

[← Brand](brand.md) · [All guides](README.md) · [Pages →](pages.md)
