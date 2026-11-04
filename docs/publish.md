# Publish

Build a static site and serve the `dist/` folder. Any host that can serve files can publish it.

## Build

```bash
npm run check:posts
npm run build
```

`npm run build` writes HTML, feeds, and the sitemap to `dist/`. Preview that folder:

```bash
npm run preview
```

## Public URL

Feeds, the sitemap, and canonical URLs need the public origin. Set these before `npm run build` when the site is not served from the default.

| Variable | What to put in it | Example |
| --- | --- | --- |
| `OPENBLOG_BASE_URL` | Origin only, with a trailing slash | `https://blog.example.com/` or `https://you.github.io/` |
| `OPENBLOG_BASE_PATH` | Path under that origin | `/` at the root, or `/your-repo` for a project path |

`SITE_URL` is used when `OPENBLOG_BASE_URL` is unset. Keep the path in `OPENBLOG_BASE_PATH` only.

If neither URL variable is set, the build uses `https://example.com/` from `openblog.config.ts`. Set a real origin before you publish.

```bash
OPENBLOG_BASE_URL=https://blog.example.com/ OPENBLOG_BASE_PATH=/ npm run build
npm run preview
```

## Feeds and sitemap

Every successful build writes:

| File | What it is |
| --- | --- |
| `/rss.xml` | RSS feed |
| `/atom.xml` | Atom feed |
| `/feed.json` | JSON Feed |
| `/sitemap.xml` | Sitemap |

The footer and page head link to the feeds with site-relative paths. Drafts are omitted. A post with `noindex: true` is built and left out of the feeds and the sitemap.

## GitHub Pages

This repo includes [`.github/workflows/github-pages.yml`](../.github/workflows/github-pages.yml). It runs on every push to `main`, and it can be started by hand.

1. Push the repository to GitHub.
2. Open **Settings → Pages → Build and deployment**, and choose **GitHub Actions**.
3. Push to `main`.

The workflow runs `npm run check:posts`, then `npm run build`. For a project site it sets:

```text
OPENBLOG_BASE_URL=https://<owner>.github.io/
OPENBLOG_BASE_PATH=/<repo>
```

Override those in the repository variables `OPENBLOG_BASE_URL` and `OPENBLOG_BASE_PATH` when you use a custom domain or a different path.

The published project site for this repository shows the landing page. A repository created with **Use this template** builds the blog home.
