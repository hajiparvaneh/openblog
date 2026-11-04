# Agent notes

Read the docs before changing this template.

- [docs/README.md](docs/README.md) lists every guide.
- [docs/start.md](docs/start.md) covers install and commands.
- [docs/brand.md](docs/brand.md) covers `openblog.config.ts` and `public/`.
- [docs/posts.md](docs/posts.md) covers post files, series, and translations.
- [docs/pages.md](docs/pages.md) covers About and extra pages.
- [docs/publish.md](docs/publish.md) covers the build, the public URL, and GitHub Pages.
- [docs/layout.md](docs/layout.md) maps files to routes.

`llms.txt` lists the same pages.

## Rules

- This repository is a static Markdown blog. Posts are files. The build writes HTML to `dist/`.
- Brand a site in `openblog.config.ts`, `public/`, and `content/`. Leave `src/` alone for a normal site.
- Keep each post at `content/posts/<category>/<post-name>.md`. One folder deep. Lowercase hyphen slugs.
- When behavior or frontmatter changes, update the matching file in `docs/` in the same change.
- Do not add accounts, a database, API secrets, or an in-browser editor.
