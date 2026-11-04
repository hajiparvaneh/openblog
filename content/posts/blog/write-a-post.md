---
title: Write a post as a Markdown file
description: Add a .md file under a category folder, set the series fields, and the static build picks it up.
date: 2026-03-11
series: File-based blogging
seriesOrder: 1
tags: [openblog, markdown, series]
---

A post is a file. The folder name is the category, and the file name is the slug.

## Create the file

```text
content/posts/blog/write-a-post.md
```

The frontmatter below is enough to join a series:

```yaml
---
title: Write a post as a Markdown file
date: 2026-03-11
series: File-based blogging
seriesOrder: 1
---
```

## Check it before you publish

Run the content checker, then open the local site:

```bash
npm run check:posts
npm run dev
```

The checker fails the build when a title or date is missing, a slug is not lowercase, or `translateOf` points at a file that is not there.
