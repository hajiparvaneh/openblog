# Changelog

## 0.1.0 — OpenBlog Starter

First reusable starter release.

### Added
- Default credential-free static blog (`src/starter`) with Markdown posts, categories, tags, About, sitemap, and robots.txt
- Config-first branding via `openblog.config.ts` and `public/branding/`
- GitHub Pages workflow with project-site base path and custom-domain variables
- Sample getting-started posts and MIT license
- `npm run test:standalone` and `npm run verify:first-publish` validation scripts
- Community homepage CTAs: **Start your blog** (primary) and **View live demo** (secondary), with separate Contribute path

### Community (opt-in)
- Original openblog.cc app remains available with `OPENBLOG_COMMUNITY=true`
- Scoring workflow remains gated on repository variable `OPENBLOG_COMMUNITY=true`
