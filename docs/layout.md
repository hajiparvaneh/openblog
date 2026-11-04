# Layout

[All guides](README.md) · [Start](start.md) · [Brand](brand.md) · [Posts](posts.md) · [Pages](pages.md) · [Publish](publish.md) · **Layout**

Where files live, which URL they become, and which source file owns a behavior. A branded blog usually changes `openblog.config.ts`, `public/`, and `content/` only.

On this page: [Repository](#repository) · [Routes](#routes) · [Where behavior lives](#where-behavior-lives)

## Repository

```text
openblog.config.ts          Name, author, nav, footer, license. See Brand.
content/
  about.md                  About page. See Pages.
  pages/*.md                Extra pages such as Now and Colophon
  posts/<category>/*.md     One post per file. See Posts.
public/                     Logos, favicon, and other images. See Brand.
docs/                       These guides
AGENTS.md                   Short rules for changing the template
llms.txt                    Doc list for agents
public/llms.txt             Same list, served at /llms.txt
src/                        Theme, pages, and build logic
scripts/check-posts.mjs     Content checker used by npm run check:posts
.github/workflows/          GitHub Pages deploy. See Publish.
```

Install and the npm scripts are in [Start → Commands](start.md#commands).

## Routes

| Path | Source | Guide |
| --- | --- | --- |
| `/` | Home page, from published posts | [Posts](posts.md) |
| `/posts/<category>/<slug>` | `content/posts/<category>/<slug>.md` | [Posts → File name](posts.md#file-name) |
| `/categories/<category>` | Every post in that folder | [Posts](posts.md#file-name) |
| `/tag/<tag>` | Posts that include that tag | [Posts → All fields](posts.md#all-fields) |
| `/series` and `/series/<slug>` | Posts that share a `series` name | [Posts → Series](posts.md#series) |
| `/archive` | Posts grouped by year | [Posts → All fields](posts.md#all-fields) |
| `/search` | Browser filter over published posts | [Posts → All fields](posts.md#all-fields) |
| `/about` | `content/about.md` | [Pages → About](pages.md#about) |
| `/<page>` | `content/pages/<page>.md` | [Pages → Extra pages](pages.md#extra-pages) |
| `/rss.xml`, `/atom.xml`, `/feed.json` | Generated at build time | [Publish → Feeds and sitemap](publish.md#feeds-and-sitemap) |
| `/sitemap.xml` | Generated at build time | [Publish → Feeds and sitemap](publish.md#feeds-and-sitemap) |

Drafts are not routed. A `noindex` post is routed and left out of the sitemap and the feeds.

## Where behavior lives

Change these files only when the template itself should change. Then update the matching guide.

| Change | File | Update |
| --- | --- | --- |
| Which posts are included, and how series and tags are grouped | `src/lib/posts.ts` | [Posts](posts.md) |
| Required fields and slug rules | `src/lib/post-model.mjs` | [Posts](posts.md#check-before-you-publish) or [Pages](pages.md#reserved-names) |
| Markdown, heading ids, and code highlighting | `src/lib/markdown.ts` | [Posts → Body](posts.md#body) |
| Feed XML and JSON | `src/lib/feeds.ts` | [Publish → Feeds and sitemap](publish.md#feeds-and-sitemap) |
| Extra pages | `src/lib/pages.ts` | [Pages](pages.md) |
| Header, footer, and sidebar | `src/layouts/BaseLayout.astro` | [Brand](brand.md#navigation-and-footer) |
| Shared visual styles | `src/styles/global.css` | [Brand](brand.md#theme-and-license) |

The content checker and the site use `src/lib/post-model.mjs` for the same rules.

[← Publish](publish.md) · [All guides](README.md) · [Start →](start.md)
