<p align="center">
  <img src="public/openblog-logo-light.png" alt="OpenBlog" width="160" />
</p>

<h1 align="center">OpenBlog</h1>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="MIT License" /></a>
  <a href="https://astro.build/"><img src="https://img.shields.io/badge/Built%20with-Astro-ff5d01" alt="Built with Astro" /></a>
</p>

<p align="center">
  <strong>A free, open-source blog powered by Markdown files in git.</strong><br />
  Brand it, write posts as <code>.md</code> files, and publish a static site. MIT licensed.
</p>

<p align="center">
  🏠 Project site: <a href="https://hajiparvaneh.github.io/openblog/">hajiparvaneh.github.io/openblog</a>
</p>

---

## 🚀 Start

You need [Node.js](https://nodejs.org/) 22 or newer and [git](https://git-scm.com/).

On GitHub, choose **Use this template**, then **Create a new repository**.

```bash
git clone https://github.com/<you>/<your-blog>.git my-blog
cd my-blog
npm install
npm run dev
```

Open the local URL from the terminal, usually `http://localhost:4321`. The full steps are in [docs/start.md](docs/start.md).

## 📚 Docs

| Guide | What it covers |
| --- | --- |
| 🚀 [Start](docs/start.md) | Install, first run, and npm scripts |
| 🎨 [Brand](docs/brand.md) | `openblog.config.ts` and images in `public/` |
| ✍️ [Posts](docs/posts.md) | Post files, series, translations, drafts |
| 📄 [Pages](docs/pages.md) | About and extra pages |
| 🌍 [Publish](docs/publish.md) | Build, public URL, feeds, GitHub Pages |
| 📂 [Layout](docs/layout.md) | Where files and routes live |

[llms.txt](llms.txt) lists the same pages for agents.

## ✨ What you get

- 📝 **Markdown posts** in git, with 📁 categories, tags, series, and a year archive
- 🔍 **Search** in the browser
- 🌐 **RSS, Atom, and JSON** feeds
- 🔤 **Translations**, reading time, a table of contents, and syntax highlighting
- 🌓 Light and dark themes
- 📦 A static build with no database

This repository is the template. [The project site](https://hajiparvaneh.github.io/openblog/) is the landing page for OpenBlog. A site created with **Use this template** builds the blog.

## 📜 License

[MIT](LICENSE). The default license for post text is set in `openblog.config.ts` and can be changed there.
