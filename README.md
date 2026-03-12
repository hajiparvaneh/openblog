# Git Blog Play (MVP)

A minimal Git-based collaborative blog game built with Astro.

## Architecture

- `content/posts/*.md`: blog posts
- `game/events/*.json`: immutable merged-PR score events
- `game/generated/users/*.json`: generated user aggregates
- `game/generated/leaderboard.json`: generated leaderboard
- `.github/workflows/score-pr.yml`: scoring + generation workflow

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

## Notes

- Protect `main` branch.
- Keep `game/generated/*` bot-managed only.
- If you later add database/EF-backed services, remember to create EF migrations manually.
