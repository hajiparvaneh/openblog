import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const eventsDir = path.join(root, 'openblog/events');
const generatedUsersDir = path.join(root, 'openblog/generated/users');
const leaderboardFile = path.join(root, 'openblog/generated/leaderboard.json');

fs.mkdirSync(generatedUsersDir, { recursive: true });

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

const events = fs
  .readdirSync(eventsDir)
  .filter((file) => file.endsWith('.json'))
  .map((file) => JSON.parse(fs.readFileSync(path.join(eventsDir, file), 'utf8')))
  .sort((a, b) => a.mergedAt.localeCompare(b.mergedAt));

const users = new Map();

for (const event of events) {
  const current = users.get(event.username) ?? {
    username: event.username,
    profileUrl: `https://github.com/${event.username}`,
    avatarUrl: null,
    joinedAt: event.mergedAt,
    lastUpdatedAt: event.mergedAt,
    totalPoints: 0,
    acceptedPrs: 0,
    acceptedPrNumbers: new Set(),
    totalContributions: 0,
    events: [],
    contributedPostSlugs: new Set(),
    labelsUsed: new Set(),
    lastContribution: null
  };

  if (event.userAvatarUrl) {
    current.avatarUrl = event.userAvatarUrl;
  }

  const contributions = getEventContributions(event);
  if (contributions.length === 0) {
    continue;
  }

  if (event.mergedAt < current.joinedAt) {
    current.joinedAt = event.mergedAt;
  }
  if (event.mergedAt >= current.lastUpdatedAt) {
    const lastContribution = contributions[0];
    current.lastUpdatedAt = event.mergedAt;
    current.lastContribution = {
      prNumber: event.prNumber,
      postSlug: lastContribution.postSlug,
      mergedAt: event.mergedAt,
      points: lastContribution.points
    };
  }

  current.acceptedPrNumbers.add(event.prNumber);
  current.acceptedPrs = current.acceptedPrNumbers.size;
  current.events.push(event.prNumber);
  for (const contribution of contributions) {
    current.totalPoints += contribution.points;
    current.totalContributions += 1;
    current.contributedPostSlugs.add(contribution.postSlug);
    for (const label of contribution.labels) {
      current.labelsUsed.add(label);
    }
  }
  users.set(event.username, current);
}

const leaderboard = [];

for (const user of users.values()) {
  const serializedUser = {
    username: user.username,
    profileUrl: user.profileUrl,
    avatarUrl: user.avatarUrl,
    joinedAt: user.joinedAt,
    lastUpdatedAt: user.lastUpdatedAt,
    totalPoints: user.totalPoints,
    acceptedPrs: user.acceptedPrs,
    totalContributions: user.totalContributions,
    totalPostsContributed: user.contributedPostSlugs.size,
    contributedPostSlugs: [...user.contributedPostSlugs].sort((a, b) => a.localeCompare(b)),
    labelsUsed: [...user.labelsUsed].sort((a, b) => a.localeCompare(b)),
    events: [...new Set(user.events)].sort((a, b) => a - b),
    lastContribution: user.lastContribution
  };

  const userPath = path.join(generatedUsersDir, `${user.username}.json`);
  fs.writeFileSync(userPath, `${JSON.stringify(serializedUser, null, 2)}\n`);

  leaderboard.push({
    username: user.username,
    avatarUrl: user.avatarUrl,
    totalPoints: user.totalPoints,
    acceptedPrs: user.acceptedPrs
  });
}

leaderboard
  .sort((a, b) => b.totalPoints - a.totalPoints || b.acceptedPrs - a.acceptedPrs);

const updatedAt = events.length > 0 ? events[events.length - 1].mergedAt : null;

fs.writeFileSync(
  leaderboardFile,
  `${JSON.stringify({ updatedAt, leaderboard }, null, 2)}\n`
);

console.log(`Generated leaderboard for ${leaderboard.length} users.`);
