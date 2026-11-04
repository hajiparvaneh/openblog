# Publish

[All guides](README.md) · [Start](start.md) · [Brand](brand.md) · [Posts](posts.md) · [Pages](pages.md) · **Publish** · [Layout](layout.md)

Build a static site and serve the `dist/` folder. Any host that can serve files can publish it.

On this page: [Build](#build) · [Public URL](#public-url) · [Feeds and sitemap](#feeds-and-sitemap) · [GitHub Pages](#github-pages) · [Any static host](#any-static-host)

## Build

From the repository root:

```bash
npm run check:posts
npm run build
npm run preview
```

`npm run check:posts` is the content check from [Posts](posts.md#check-before-you-publish) and [Pages](pages.md#reserved-names). `npm run build` writes HTML, feeds, and the sitemap to `dist/`. `npm run preview` serves that folder so you can read the production pages before they go live. The other commands are in [Start → Commands](start.md#commands).

## Public URL

Feeds, the sitemap, and canonical URLs need the public origin. Set these before `npm run build` when the site is not served from the placeholder in config.

| Variable | What to put in it | Example |
| --- | --- | --- |
| `OPENBLOG_BASE_URL` | Origin only, with a trailing slash | `https://blog.example.com/` or `https://you.github.io/` |
| `OPENBLOG_BASE_PATH` | Path under that origin | `/` at the root, or `/your-repo` for a project path |

`SITE_URL` is used when `OPENBLOG_BASE_URL` is unset. Keep the path in `OPENBLOG_BASE_PATH` only. Do not put `/your-repo` in both.

If neither URL variable is set, the build uses `https://example.com/` from [`openblog.config.ts`](../openblog.config.ts). Footer and head links stay site-relative (`/rss.xml`). The addresses inside the feed files and the sitemap use the configured origin, so set a real one before you publish.

`siteUrl` and `basePath` in the config file are the same two values for a local build that does not set the environment. See [Brand → Config file](brand.md#config-file).

```bash
OPENBLOG_BASE_URL=https://blog.example.com/ OPENBLOG_BASE_PATH=/ npm run build
npm run preview
```

A post with [`canonical`](posts.md#all-fields) set keeps that absolute URL. The public origin is used for every other page.

## Feeds and sitemap

Every successful build writes:

| File | What it is |
| --- | --- |
| `/rss.xml` | RSS feed |
| `/atom.xml` | Atom feed |
| `/feed.json` | JSON Feed |
| `/sitemap.xml` | Sitemap |

The footer and the page head link to the feeds with site-relative paths. Drafts are omitted. A post with `noindex: true` is built and left out of the feeds and the sitemap. Both fields are in [Posts → All fields](posts.md#all-fields).

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

The public address is then `https://<owner>.github.io/<repo>/`. Override the two variables with repository variables of the same names when you use a custom domain or a different path.

The published project site for this repository shows the landing page. A repository created with **Use this template** builds the blog home. Creating that repository is in [Start](start.md#create-a-site).

## Any static host

Upload the contents of `dist/` after a build that used the [public URL](#public-url) for that host. The host should serve `index.html` for each folder and should not rewrite the `.xml` feed files into HTML. No database and no server process are required.

[← Pages](pages.md) · [All guides](README.md) · [Layout →](layout.md)
