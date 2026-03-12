import fs from 'node:fs';
import path from 'node:path';
import { calculatePoints } from './scoring.mjs';

const payload = {
  prNumber: Number(process.env.PR_NUMBER),
  username: process.env.PR_USERNAME,
  userAvatarUrl: process.env.PR_USER_AVATAR_URL || undefined,
  postSlug: process.env.PR_POST_SLUG,
  mergedAt: process.env.PR_MERGED_AT,
  labels: (process.env.PR_LABELS ?? '').split(',').map((s) => s.trim()).filter(Boolean)
};

if (!payload.prNumber || !payload.username || !payload.postSlug || !payload.mergedAt) {
  console.log('Missing required PR metadata; no event generated.');
  process.exit(0);
}

const points = calculatePoints(payload.labels);
if (points <= 0) {
  console.log('No scoring labels found; skipping event generation.');
  process.exit(0);
}

const event = {
  eventType: 'pr_merged',
  ...payload,
  points
};

const eventPath = path.join(process.cwd(), 'openblog/events', `pr-${payload.prNumber}.json`);
fs.writeFileSync(eventPath, `${JSON.stringify(event, null, 2)}\n`);
console.log(`Created ${eventPath}`);
