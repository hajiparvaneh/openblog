# Writing posts

Create files at:

`content/posts/<category>/<post>.md`

## Frontmatter

| Field | Required | Notes |
| --- | --- | --- |
| `title` | yes | Post title |
| `description` | recommended | Short summary for cards/SEO |
| `date` | yes | `YYYY-MM-DD` |
| `tags` | no | Array or comma-separated list |
| `thumbnail` | no | Path under `public/` or absolute URL |
| `thumbnailAlt` | no | Alt text for thumbnail |
| `featured` | no | Boolean |
| `draft` | no | If `true`, post is excluded from the build |
| `lang` | no | Defaults to `en` |

## Tips

- Keep category folders lowercase and hyphenated
- Prefer focused PRs (one post or one topic)
- Preview with `npm run dev` before opening a PR
