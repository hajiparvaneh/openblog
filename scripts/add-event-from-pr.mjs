import fs from 'node:fs';
import path from 'node:path';
import { calculatePoints } from './scoring.mjs';

function parseCsvList(raw) {
  const seen = new Set();
  const values = [];
  for (const item of (raw ?? '').split(',')) {
    const value = item.trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    values.push(value);
  }
  return values;
}

function parsePostSlugList() {
  return parseCsvList(process.env.PR_POST_SLUGS ?? process.env.PR_POST_SLUG ?? '');
}

function parseNewPostSlugList() {
  return parseCsvList(process.env.PR_NEW_POST_SLUGS ?? '');
}

function parseRenamedFromSlugList() {
  return parseCsvList(process.env.PR_RENAMED_FROM_SLUGS ?? '');
}

function parseRenamedToSlugList() {
  return parseCsvList(process.env.PR_RENAMED_TO_SLUGS ?? '');
}

function parseMetadataPostSlugList() {
  return parseCsvList(process.env.PR_METADATA_POST_SLUGS ?? '');
}

function canonicalizePostSlug(postSlug) {
  return postSlug
    .trim()
    .replace(/\\/g, '/')
    .replace(/\.md$/i, '')
    .replace(/^content\/posts\//i, '')
    .replace(/^\/+/, '');
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

function buildRenameMap(fromSlugs, toSlugs) {
  const size = Math.min(fromSlugs.length, toSlugs.length);
  const renameMap = new Map();

  for (let index = 0; index < size; index += 1) {
    const from = canonicalizePostSlug(fromSlugs[index]);
    const to = canonicalizePostSlug(toSlugs[index]);
    if (!from || !to || from === to) continue;
    renameMap.set(from, to);
  }

  return renameMap;
}

function applySlugRenameMigrations(renameMap) {
  if (renameMap.size === 0) return { changedFiles: 0, migratedContributions: 0 };

  const eventsRoot = path.join(process.cwd(), 'openblog/events');
  if (!fs.existsSync(eventsRoot)) return { changedFiles: 0, migratedContributions: 0 };

  let changedFiles = 0;
  let migratedContributions = 0;

  for (const file of fs.readdirSync(eventsRoot)) {
    if (!file.endsWith('.json')) continue;

    const eventPath = path.join(eventsRoot, file);
    const event = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
    let changed = false;

    if (Array.isArray(event.contributions)) {
      for (const contribution of event.contributions) {
        if (!contribution || typeof contribution.postSlug !== 'string') continue;
        const canonical = canonicalizePostSlug(contribution.postSlug);
        const renamedTo = renameMap.get(canonical);
        if (!renamedTo) continue;
        contribution.postSlug = renamedTo;
        migratedContributions += 1;
        changed = true;
      }
    }

    if (typeof event.postSlug === 'string') {
      const canonical = canonicalizePostSlug(event.postSlug);
      const renamedTo = renameMap.get(canonical);
      if (renamedTo) {
        event.postSlug = renamedTo;
        migratedContributions += 1;
        changed = true;
      }
    }

    if (!changed) continue;

    fs.writeFileSync(eventPath, `${JSON.stringify(event, null, 2)}\n`);
    changedFiles += 1;
  }

  return { changedFiles, migratedContributions };
}

const payload = {
  prNumber: Number(process.env.PR_NUMBER),
  username: process.env.PR_USERNAME,
  userAvatarUrl: process.env.PR_USER_AVATAR_URL || undefined,
  postSlugs: parsePostSlugList(),
  newPostSlugs: parseNewPostSlugList(),
  renamedFromSlugs: parseRenamedFromSlugList(),
  renamedToSlugs: parseRenamedToSlugList(),
  metadataPostSlugs: parseMetadataPostSlugList(),
  mergedAt: process.env.PR_MERGED_AT,
  labels: parseCsvList(process.env.PR_LABELS ?? '')
};

const renameMap = buildRenameMap(payload.renamedFromSlugs, payload.renamedToSlugs);
const renameMigration = applySlugRenameMigrations(renameMap);
if (renameMigration.migratedContributions > 0) {
  console.log(
    `Migrated ${renameMigration.migratedContributions} historical contribution slug(s) across ${renameMigration.changedFiles} event file(s).`
  );
}

const allTargetSlugs = parseCsvList([...payload.postSlugs, ...payload.newPostSlugs].join(','));
if (!payload.prNumber || !payload.username || allTargetSlugs.length === 0 || !payload.mergedAt) {
  console.log('Missing required PR metadata; no event generated.');
  process.exit(0);
}

const eventPath = path.join(process.cwd(), 'openblog/events', `pr-${payload.prNumber}.json`);
const existingEvent = fs.existsSync(eventPath)
  ? JSON.parse(fs.readFileSync(eventPath, 'utf8'))
  : null;
const contributionsBySlug = new Map(
  getEventContributions(existingEvent ?? {}).map((contribution) => [contribution.postSlug, contribution])
);

const newPostSlugSet = new Set(payload.newPostSlugs);
const metadataPostSlugSet = new Set(payload.metadataPostSlugs);
let scoredContributionCount = 0;

for (const postSlug of allTargetSlugs) {
  const labels = [...payload.labels];
  if (newPostSlugSet.has(postSlug) && !labels.includes('new-post')) {
    labels.push('new-post');
  }
  if (metadataPostSlugSet.has(postSlug) && !newPostSlugSet.has(postSlug) && !labels.includes('typo')) {
    labels.push('typo');
  }

  const points = calculatePoints(labels);
  if (points <= 0) {
    continue;
  }

  contributionsBySlug.set(postSlug, { postSlug, labels, points });
  scoredContributionCount += 1;
}

if (scoredContributionCount === 0) {
  if (renameMigration.migratedContributions > 0) {
    console.log('No scoring labels found; rename migration applied and event generation skipped.');
    process.exit(0);
  }
  console.log('No scoring labels found for eligible post changes; skipping event generation.');
  process.exit(0);
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
