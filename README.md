# OpenBlog

OpenBlog is a collaborative blog where contributors improve content through pull requests.  
When a PR is merged and labeled, points are added to the public leaderboard.

## First contribution in 5 steps

1. Fork this repo and clone your fork.
2. Create a branch: `git checkout -b my-post-update`.
3. Add or edit a post in `content/posts/<category>/<post>.md`.
4. Run locally and verify your change.
5. Open a PR and mention the post slug you changed (example: `networking/how-dns-works`).

## Local development

### Requirements

- Node.js 18+ (or newer LTS)
- npm

### Commands

```bash
npm install
npm run dev
```

Open the local URL shown in the terminal.

To validate production output:

```bash
npm run build
npm run preview
```

## Add a new blog post

Create a new file in:

`content/posts/<category>/<post>.md`

Example:

`content/posts/networking/how-http-works.md`

Use this template:

```md
---
title: How HTTP Works
description: A beginner-friendly explanation of the HTTP request/response model.
date: 2026-03-12
---

Start with a short intro.

## Main section

Add clear examples, references, and practical notes.
```

Guidelines:

- Keep category and filename lowercase and hyphenated.
- Write clear, factual content with practical examples.
- Keep changes focused (one post/topic per PR when possible).

## Improve an existing post

Good contribution types:

- Fix typos or wording
- Add trusted sources
- Fact-check outdated statements
- Add examples/diagrams/explanations
- Add translations

## PR checklist

- Changes are in `content/posts/<category>/<post>.md`
- PR description explains what improved and why
- PR mentions changed slug(s)
- No manual edits to `game/generated/*`

## Scoring labels

Points are based on PR labels in `game/enums/scoring-labels.json`:

- `typo`: +5
- `source-added`: +10
- `fact-check`: +15
- `new-example`: +20
- `translation`: +30
- `new-post`: +50

Notes:

- Only merged PRs are eligible.
- At least one scoring label is required to generate an event.
- If multiple scoring labels are applied, points are summed.

## Project structure

- `content/posts/<category>/*.md`: blog content
- `game/events/*.json`: immutable merged-PR score events
- `game/enums/scoring-labels.json`: score label enum
- `game/generated/users/*.json`: generated user stats
- `game/generated/leaderboard.json`: generated leaderboard
- `scripts/add-event-from-pr.mjs`: create event from merged PR metadata
- `scripts/generate-game-state.mjs`: regenerate users + leaderboard

## Maintainer notes

These commands are mainly for maintainers/automation:

```bash
npm run game:add-event
npm run game:generate
```

Recommended guardrails:

- Protect `main` branch
- Keep `game/generated/*` maintainer/bot-managed
- Enforce scoring-label policy
