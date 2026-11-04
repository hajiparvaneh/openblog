# Start

[All guides](README.md) · **Start** · [Brand](brand.md) · [Posts](posts.md) · [Pages](pages.md) · [Publish](publish.md) · [Layout](layout.md)

Create a repository from this template, install dependencies, and open the local site.

On this page: [Requirements](#requirements) · [Create a site](#create-a-site) · [What to edit first](#what-to-edit-first) · [Commands](#commands)

## Requirements

- [Node.js](https://nodejs.org/) 22 or newer
- [git](https://git-scm.com/)

## Create a site

On GitHub, choose **Use this template**, then **Create a new repository**. Clone that repository:

```bash
git clone https://github.com/<you>/<your-blog>.git my-blog
cd my-blog
npm install
npm run dev
```

Open the local URL printed in the terminal. It is usually `http://localhost:4321`.

The home page lists posts. Header links open the [archive](layout.md#routes), search, and About. The footer links to the feeds once you [publish](publish.md#feeds-and-sitemap).

To clone this repository directly:

```bash
git clone https://github.com/hajiparvaneh/openblog.git my-blog
cd my-blog
npm install
npm run dev
```

A normal site does not need changes under `src/`. The file map is in [Layout](layout.md).

## What to edit first

1. Set the name, author, and footer in [`openblog.config.ts`](../openblog.config.ts). See [Brand](brand.md#config-file).
2. Replace the images in [`public/`](../public/). See [Brand → Images](brand.md#images).
3. Rewrite [`content/about.md`](../content/about.md). See [Pages → About](pages.md#about).
4. Add a post under `content/posts/<category>/`. See [Posts → Minimum post](posts.md#minimum-post).
5. Run the content check, then build. See [Publish → Build](publish.md#build).

## Commands

Run these from the repository root.

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the local site and reloads when files change |
| `npm run build` | Writes the static site to `dist/` |
| `npm run preview` | Serves the files in `dist/` |
| `npm run check` | Runs the Astro check, then the content check |
| `npm run check:posts` | Checks [posts](posts.md#check-before-you-publish) and [extra pages](pages.md#reserved-names) only |

`npm run check:posts` fails when a title or date is missing, a file name is not a lowercase hyphenated slug, a translation points at a missing file, or two posts share a slug. The full rule list is in [Posts](posts.md#check-before-you-publish).

[← All guides](README.md) · [Brand →](brand.md)
