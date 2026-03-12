# OpenBlog (MVP)

OpenBlog is a minimal Git-based collaborative blog game built with Astro.

## Architecture

- `content/posts/<category>/*.md`: blog posts grouped by category folder
- `game/events/*.json`: immutable merged-PR score events
- `game/enums/scoring-labels.json`: scoring label enum (label -> points)
- `game/generated/users/*.json`: generated user aggregates
- `game/generated/leaderboard.json`: generated leaderboard
- `scripts/add-event-from-pr.mjs`: converts merged PR metadata into score events
- `scripts/generate-game-state.mjs`: aggregates events into user files + leaderboard

Each event can optionally include `userAvatarUrl` from the GitHub PR author profile.

## Local development

```bash
npm install
npm run dev
```

## Game data scripts

```bash
npm run game:add-event
npm run game:generate
```


## Scoring logic

- Each merged PR can create one immutable event file in `game/events/pr-<number>.json`.
- Points are computed from labels in `game/enums/scoring-labels.json` and summed per PR.
  - `typo`: 5
  - `source-added`: 10
  - `fact-check`: 15
  - `new-example`: 20
  - `translation`: 30
  - `new-post`: 50
- A PR with no scoring labels gets 0 and is skipped (no event file).
- The generator aggregates all events by `username` into:
  - `game/generated/users/<username>.json`
  - `game/generated/leaderboard.json`
  - user and leaderboard entries include `avatarUrl` when available
  - user files include public metadata like:
    - `profileUrl`
    - `joinedAt`
    - `lastUpdatedAt`
    - `totalPostsContributed`
    - `contributedPostSlugs`
    - `labelsUsed`
    - `lastContribution`
- Leaderboard sorting: highest `totalPoints`, then highest `acceptedPrs`.

## Owner checklist

- Define and enforce a consistent PR-label policy using only supported scoring labels.
- Require the `Validate post file changes` GitHub check in branch protection so non-owner PRs can only add/edit `content/posts/<category>/<post>.md` (new categories are allowed by creating a new folder under `content/posts/`).
- Ensure merged PR metadata is passed to `npm run game:add-event` (PR number, username, avatar URL, post slug, merged time, labels).
- Run `npm run game:generate` after adding events and commit generated files.
- Protect `main` so only reviewed + labeled PRs are merged.
- Keep `game/generated/*` bot/maintainer-managed only to avoid manual tampering.

## Notes

- Protect `main` branch.
- Keep `game/generated/*` bot-managed only.
- If you later add database/EF-backed services, remember to create EF migrations manually.
