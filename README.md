# Git Blog Play (MVP)

A minimal Git-based collaborative blog game built with Astro.

## Architecture

- `content/posts/*.md`: blog posts
- `game/events/*.json`: immutable merged-PR score events
- `game/enums/scoring-labels.json`: scoring label enum (label -> points)
- `game/generated/users/*.json`: generated user aggregates
- `game/generated/leaderboard.json`: generated leaderboard
- `scripts/add-event-from-pr.mjs`: converts merged PR metadata into score events
- `scripts/generate-game-state.mjs`: aggregates events into user files + leaderboard

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
- A PR with no scoring labels gets 0 and is skipped (no event file).
- The generator aggregates all events by `username` into:
  - `game/generated/users/<username>.json`
  - `game/generated/leaderboard.json`
- Leaderboard sorting: highest `totalPoints`, then highest `acceptedPrs`.

## Owner checklist

- Define and enforce a consistent PR-label policy using only supported scoring labels.
- Ensure merged PR metadata is passed to `npm run game:add-event` (PR number, username, post slug, merged time, labels).
- Run `npm run game:generate` after adding events and commit generated files.
- Protect `main` so only reviewed + labeled PRs are merged.
- Keep `game/generated/*` bot/maintainer-managed only to avoid manual tampering.

## Notes

- Protect `main` branch.
- Keep `game/generated/*` bot-managed only.
- If you later add database/EF-backed services, remember to create EF migrations manually.
