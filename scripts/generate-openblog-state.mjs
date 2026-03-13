import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const eventsDir = path.join(root, 'openblog/events');
const generatedUsersDir = path.join(root, 'openblog/generated/users');
const generatedCategoriesDir = path.join(root, 'openblog/generated/categories');
const leaderboardFile = path.join(root, 'openblog/generated/leaderboard.json');
const postsDir = path.join(root, 'content/posts');

fs.mkdirSync(generatedUsersDir, { recursive: true });
fs.mkdirSync(generatedCategoriesDir, { recursive: true });

function normalizeCategoryKey(category) {
  return category.trim().toLowerCase().replace(/[\s_]+/g, '-');
}

function canonicalizePostSlug(postSlug) {
  return postSlug
    .trim()
    .replace(/\\/g, '/')
    .replace(/\.md$/i, '')
    .replace(/^content\/posts\//i, '')
    .replace(/^\/+/, '');
}

function collectPostMetadata() {
  const slugToCategory = new Map();
  const knownCategories = new Set();

  if (!fs.existsSync(postsDir)) {
    return { slugToCategory, knownCategories };
  }

  for (const categoryEntry of fs.readdirSync(postsDir, { withFileTypes: true })) {
    if (!categoryEntry.isDirectory()) continue;
    const categoryKey = normalizeCategoryKey(categoryEntry.name);
    knownCategories.add(categoryKey);

    const categoryDir = path.join(postsDir, categoryEntry.name);
    for (const postEntry of fs.readdirSync(categoryDir, { withFileTypes: true })) {
      if (!postEntry.isFile() || !postEntry.name.endsWith('.md')) continue;
      const postName = postEntry.name.replace(/\.md$/, '');
      slugToCategory.set(`${categoryEntry.name}/${postName}`, categoryKey);
    }
  }

  return { slugToCategory, knownCategories };
}

function resolvePostSlug(postSlug, availableSlugs) {
  const raw = postSlug.trim().replace(/\\/g, '/');
  if (!raw) return null;

  const candidates = new Set([raw]);
  const withoutMd = raw.replace(/\.md$/i, '');
  candidates.add(withoutMd);
  candidates.add(withoutMd.replace(/^content\/posts\//i, ''));
  candidates.add(withoutMd.replace(/^\/+/, ''));

  for (const candidate of candidates) {
    if (availableSlugs.has(candidate)) return candidate;
  }

  const leaf = withoutMd.split('/').filter(Boolean).at(-1);
  if (!leaf) return null;

  const matches = [...availableSlugs].filter((slug) => slug.endsWith(`/${leaf}`));
  return matches.length === 1 ? matches[0] : null;
}

function inferCategoryFromPostSlug(postSlug, availableSlugs, slugToCategory) {
  const resolvedPostSlug = resolvePostSlug(postSlug, availableSlugs);
  if (resolvedPostSlug && slugToCategory.has(resolvedPostSlug)) {
    return slugToCategory.get(resolvedPostSlug);
  }

  const canonical = canonicalizePostSlug(postSlug);
  const firstSegment = canonical.split('/').filter(Boolean)[0];
  return firstSegment ? normalizeCategoryKey(firstSegment) : null;
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

const events = fs.existsSync(eventsDir)
  ? fs
    .readdirSync(eventsDir)
    .filter((file) => file.endsWith('.json'))
    .map((file) => JSON.parse(fs.readFileSync(path.join(eventsDir, file), 'utf8')))
    .sort((a, b) => a.mergedAt.localeCompare(b.mergedAt))
  : [];

const { slugToCategory, knownCategories } = collectPostMetadata();
const knownPostSlugs = new Set(slugToCategory.keys());

const users = new Map();
const categoryLeaderboards = new Map();
const categoryUpdatedAt = new Map();

for (const event of events) {
  if (!event.username || !event.mergedAt || !Number.isFinite(event.prNumber)) {
    continue;
  }

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
    const resolvedPostSlug = resolvePostSlug(contribution.postSlug, knownPostSlugs) ?? canonicalizePostSlug(contribution.postSlug);

    current.totalPoints += contribution.points;
    current.totalContributions += 1;
    current.contributedPostSlugs.add(resolvedPostSlug);
    for (const label of contribution.labels) {
      current.labelsUsed.add(label);
    }

    const category = inferCategoryFromPostSlug(contribution.postSlug, knownPostSlugs, slugToCategory);
    if (!category) continue;

    const byUser = categoryLeaderboards.get(category) ?? new Map();
    const categoryUser = byUser.get(event.username) ?? {
      username: event.username,
      avatarUrl: null,
      totalPoints: 0,
      acceptedPrNumbers: new Set(),
      totalContributions: 0,
      contributedPostSlugs: new Set()
    };

    if (event.userAvatarUrl) {
      categoryUser.avatarUrl = event.userAvatarUrl;
    }

    categoryUser.totalPoints += contribution.points;
    categoryUser.acceptedPrNumbers.add(event.prNumber);
    categoryUser.totalContributions += 1;
    categoryUser.contributedPostSlugs.add(resolvedPostSlug);
    byUser.set(event.username, categoryUser);
    categoryLeaderboards.set(category, byUser);

    const previousUpdatedAt = categoryUpdatedAt.get(category);
    if (!previousUpdatedAt || event.mergedAt > previousUpdatedAt) {
      categoryUpdatedAt.set(category, event.mergedAt);
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

for (const file of fs.readdirSync(generatedCategoriesDir)) {
  if (file.endsWith('.json')) {
    fs.unlinkSync(path.join(generatedCategoriesDir, file));
  }
}

const sortedCategories = [...knownCategories].sort((a, b) => a.localeCompare(b));

for (const category of sortedCategories) {
  const usersInCategory = categoryLeaderboards.get(category) ?? new Map();
  const categoryLeaderboard = [...usersInCategory.values()]
    .map((user) => ({
      username: user.username,
      avatarUrl: user.avatarUrl,
      totalPoints: user.totalPoints,
      acceptedPrs: user.acceptedPrNumbers.size,
      totalContributions: user.totalContributions,
      totalPostsContributed: user.contributedPostSlugs.size
    }))
    .sort(
      (a, b) =>
        b.totalPoints - a.totalPoints ||
        b.acceptedPrs - a.acceptedPrs ||
        a.username.localeCompare(b.username)
    );

  const categoryLeaderboardPath = path.join(generatedCategoriesDir, `${category}.json`);
  fs.writeFileSync(
    categoryLeaderboardPath,
    `${JSON.stringify({
      category,
      updatedAt: categoryUpdatedAt.get(category) ?? null,
      leaderboard: categoryLeaderboard
    }, null, 2)}\n`
  );
}

console.log(`Generated leaderboard for ${leaderboard.length} users and ${sortedCategories.length} categories.`);
