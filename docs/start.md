# Start

Create a repository from this template, install dependencies, and open the local site.

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

To clone this repository directly:

```bash
git clone https://github.com/hajiparvaneh/openblog.git my-blog
cd my-blog
npm install
npm run dev
```

## What to edit first

1. Set the name, author, and footer in [`openblog.config.ts`](../openblog.config.ts). See [Brand](brand.md).
2. Replace the images in [`public/`](../public/).
3. Rewrite [`content/about.md`](../content/about.md). See [Pages](pages.md).
4. Add a post under `content/posts/<category>/`. See [Posts](posts.md).

A normal site does not need changes under `src/`.

## Commands

Run these from the repository root.

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the local site and reloads when files change |
| `npm run build` | Writes the static site to `dist/` |
| `npm run preview` | Serves the files in `dist/` |
| `npm run check` | Runs the Astro check, then the content check |
| `npm run check:posts` | Checks posts and extra pages only |

`npm run check:posts` fails when a title or date is missing, a file name is not a lowercase hyphenated slug, a translation points at a missing file, or two posts share a slug.

## Next

[Brand the site](brand.md), then [write a post](posts.md).
