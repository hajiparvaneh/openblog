# Demo script — Markdown PR → live post (OPB-8)

Record a short screen capture (2–4 minutes) after v0.1.0 is tagged.

## Setup (before recording)

1. Enable **Template repository** on https://github.com/hajiparvaneh/openblog
2. Create a throwaway demo repo from **Use this template**
3. Enable **Settings → Pages → GitHub Actions**
4. Wait for the first Pages deploy to finish

## Recording flow

1. Show the openblog.cc homepage: click **Start your blog**
2. Create the repo from the template (or open a prepared demo repo)
3. Clone locally (or use github.dev):
   - Edit `openblog.config.ts` title
   - Replace `public/branding/logo-dark.png` optional
   - Add `content/posts/demo/hello-openblog.md`
4. Commit on a branch → open PR → merge to `main`
5. Open Actions → show Pages deploy succeed
6. Open the live URL: `https://<user>.github.io/<repo>/posts/demo/hello-openblog`
7. End on the rendered post

## Talking points

- No API keys or Worker required for the starter
- Branding is config + assets only
- Publishing is a normal Markdown pull request

## Artifact

Attach the recording to the GitHub Release for `v0.1.0` (or link it from the release notes).
