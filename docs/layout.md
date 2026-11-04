# Layout

Start from these files. A branded blog usually changes `openblog.config.ts`, `public/`, and `content/` only.

```text
openblog.config.ts          Site name, author, nav, footer, license
content/
  about.md                  About page
  pages/*.md                Extra pages such as Now and Colophon
  posts/<category>/*.md     One post per file
public/                     Logos, favicon, and other images
docs/                       These guides
AGENTS.md                   Short rules for changing the template
llms.txt                    Doc list for agents
public/llms.txt             Same list, served at /llms.txt
src/                        Theme, pages, and build logic
scripts/check-posts.mjs     Content checker used by npm run check:posts
.github/workflows/          GitHub Pages deploy
```

## Routes

| Path | Source |
| --- | --- |
| `/` | Home page |
| `/posts/<category>/<slug>` | `content/posts/<category>/<slug>.md` |
| `/categories/<category>` | Posts in that folder |
| `/tag/<tag>` | Posts that include that tag |
| `/series` and `/series/<slug>` | Posts that share a `series` name |
| `/archive` | Posts grouped by year |
| `/search` | Browser filter over published posts |
| `/about` | `content/about.md` |
| `/<page>` | `content/pages/<page>.md` |
| `/rss.xml`, `/atom.xml`, `/feed.json` | Generated feeds |
| `/sitemap.xml` | Generated sitemap |

## Where behavior lives

| Change | File |
| --- | --- |
| Which posts are included, and how series and tags are grouped | `src/lib/posts.ts` |
| Required fields and slug rules | `src/lib/post-model.mjs` |
| Markdown, heading ids, and code highlighting | `src/lib/markdown.ts` |
| Feed XML and JSON | `src/lib/feeds.ts` |
| Extra pages | `src/lib/pages.ts` |
| Header, footer, and sidebar | `src/layouts/BaseLayout.astro` |
| Shared visual styles | `src/styles/global.css` |

The content checker and the site use `src/lib/post-model.mjs` for the same rules. Change that file when a frontmatter rule changes, and update [Posts](posts.md) or [Pages](pages.md) in the same change.
