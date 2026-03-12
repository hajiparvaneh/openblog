import fs from 'node:fs';
import path from 'node:path';
import { calculatePoints } from './scoring.mjs';

function parseSlugList() {
  const raw = process.env.PR_POST_SLUGS ?? process.env.PR_POST_SLUG ?? '';
  return raw.split(',').map((item) => item.trim()).filter(Boolean);
}

function normalizeContribution(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (typeof raw.postSlug !== 'string' || !raw.postSlug.trim()) return null;
  const labels = Array.isArray(raw.labels) ? raw.labels.filter((label) => typeof label === 'string') : [];
  const points = typeof raw.points === 'number' && Number.isFinite(raw.points) ? raw.points : 0;
  return {
    postSlug: raw.postSlug,
    labels,
    points
  };
}

function getEventContributions(event) {
  if (Array.isArray(event.contributions) && event.contributions.length > 0) {
    return event.contributions
      .map((item) => normalizeContribution(item))
      .filter((item) => item !== null);
  }

  if (typeof event.postSlug === 'string' && event.postSlug.trim()) {
    const labels = Array.isArray(event.labels) ? event.labels.filter((label) => typeof label === 'string') : [];
    const points = typeof event.points === 'number' && Number.isFinite(event.points) ? event.points : 0;
    return [{ postSlug: event.postSlug, labels, points }];
  }

  return [];
}

const payload = {
  prNumber: Number(process.env.PR_NUMBER),
  username: process.env.PR_USERNAME,
  userAvatarUrl: process.env.PR_USER_AVATAR_URL || undefined,
  postSlugs: parseSlugList(),
  mergedAt: process.env.PR_MERGED_AT,
  labels: (process.env.PR_LABELS ?? '').split(',').map((s) => s.trim()).filter(Boolean)
};

if (!payload.prNumber || !payload.username || payload.postSlugs.length === 0 || !payload.mergedAt) {
  console.log('Missing required PR metadata; no event generated.');
  process.exit(0);
}

const points = calculatePoints(payload.labels);
if (points <= 0) {
  console.log('No scoring labels found; skipping event generation.');
  process.exit(0);
}

const eventPath = path.join(process.cwd(), 'openblog/events', `pr-${payload.prNumber}.json`);
const existingEvent = fs.existsSync(eventPath)
  ? JSON.parse(fs.readFileSync(eventPath, 'utf8'))
  : null;
const contributionsBySlug = new Map(
  getEventContributions(existingEvent ?? {}).map((contribution) => [contribution.postSlug, contribution])
);
for (const postSlug of payload.postSlugs) {
  contributionsBySlug.set(postSlug, { postSlug, labels: payload.labels, points });
}

const event = {
  eventType: 'pr_merged',
  prNumber: payload.prNumber,
  username: payload.username,
  userAvatarUrl: payload.userAvatarUrl,
  mergedAt: payload.mergedAt,
  contributions: [...contributionsBySlug.values()]
};

fs.writeFileSync(eventPath, `${JSON.stringify(event, null, 2)}\n`);
console.log(`Created ${eventPath}`);
