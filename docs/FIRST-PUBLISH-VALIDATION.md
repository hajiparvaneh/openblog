# First-publish validation (OPB-6)

Generated: 2026-11-03T18:58:44.762Z

## Result

- **Automated quickstart path:** PASS
- **Total automated time:** 1.2s (target &lt; 10 minutes)
- **Credentials required:** none
- **Public URL shape verified:** `https://example.github.io/nova-notes/posts/notes/hello-from-quickstart`

## Timed steps

| Step | Time |
| --- | --- |
| Scaffold fresh repo (copy starter files) | 0.05s |
| Configure branding (openblog.config.ts + about.md) | 0.00s |
| Write first Markdown post | 0.00s |
| Build static site for GitHub Pages base path | 1.11s |
| Verify branding, post URL, About, and no community routes | 0.00s |
| **Total** | **1.16s** |

## Checks

- [x] Brand via `openblog.config.ts` + `content/about.md` (no layout edits)
- [x] Add Markdown post under `content/posts/`
- [x] `npm run build` with Pages base path, no secrets / Worker / scoring data
- [x] Rendered home shows custom title + new post
- [x] Canonical post URL includes project base path
- [x] Community routes absent from starter output

## Remaining manual steps (second developer)

These need a GitHub account and cannot be finished in CI alone:

- [ ] GitHub → Use this template (requires Template repository enabled on upstream)
- [ ] Settings → Pages → Source: GitHub Actions
- [ ] Open PR with Markdown change → merge to main → wait for Pages deploy
- [ ] Share public URL https://<user>.github.io/<repo>/posts/...

## Blockers

_None found in the automated path._

## Notes for a second developer

1. Follow only the **Quickstart** section in `README.md`.
2. Do not set `OPENBLOG_COMMUNITY`.
3. Stop the clock when the Pages URL loads the merged post.
4. File any friction as blockers above or in OPB-6 comments.
