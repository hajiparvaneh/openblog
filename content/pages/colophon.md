---
title: Colophon
description: How this OpenBlog site is built, licensed, and followed.
updated: 2026-11-04
---

OpenBlog builds a static site from Markdown files in git. The code is MIT licensed. Post content uses the license named in `openblog.config.ts` (CC BY 4.0 on this starter).

## Follow

- [RSS](/rss.xml)
- [Atom](/atom.xml)
- [JSON Feed](/feed.json)

Feeds, the sitemap, and the pages all come from the same files at build time. Drafts stay out of the site. A post with `noindex: true` is left out of the sitemap and the feeds.

## What is not here

No accounts, no database, no analytics script, and no comment widget. A post can set `discussionUrl` when replies should live somewhere else, such as a GitHub Discussion or a Mastodon thread.
