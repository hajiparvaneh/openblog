import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

export type Post = {
  slug: string;
  category: string;
  categoryLabel: string;
  title: string;
  description: string;
  date: string;
  body: string;
};

type EventContributionRecord = {
  postSlug: string;
  points: number;
  labels: string[];
};

type RawEventRecord = {
  prNumber: number;
  username: string;
  userAvatarUrl?: string;
  mergedAt: string;
  postSlug?: string;
  points?: number;
  labels?: string[];
  contributions?: EventContributionRecord[];
};

type EventRecord = {
  prNumber: number;
  username: string;
  userAvatarUrl?: string;
  postSlug: string;
  points: number;
  labels: string[];
  mergedAt: string;
};

type UserRecord = { username: string; avatarUrl?: string | null; totalPoints: number; acceptedPrs: number };
export type CategoryLeaderboardRecord = UserRecord & {
  totalContributions: number;
  totalPostsContributed: number;
};

export type UserContributedPostRecord = {
  postSlug: string;
  postTitle: string;
  postExists: boolean;
  totalPoints: number;
  contributions: number;
  acceptedPrNumbers: number[];
  firstContributedAt: string;
  lastContributedAt: string;
};

export type UserProfileRecord = {
  username: string;
  profileUrl: string;
  avatarUrl?: string | null;
  totalPoints: number;
  acceptedPrs: number;
  acceptedPrNumbers: number[];
  postsContributed: number;
  totalContributions: number;
  joinedAt: string | null;
  lastContributionAt: string | null;
  contributedPosts: UserContributedPostRecord[];
};

export type LatestContributorRecord = {
  username: string;
  profileUrl: string;
  avatarUrl?: string | null;
  lastContributionAt: string;
};

type PostContributorPrRecord = {
  prNumber: number;
  points: number;
  labels: string[];
  mergedAt: string;
};

type PostContributorRecord = UserRecord & {
  labels: string[];
  pullRequests: PostContributorPrRecord[];
};

const ROOT = process.cwd();
const POSTS_DIR = path.join(ROOT, 'content/posts');
const GENERATED_USERS_DIR = path.join(ROOT, 'openblog/generated/users');
const GENERATED_CATEGORIES_DIR = path.join(ROOT, 'openblog/generated/categories');
const EVENTS_DIR = path.join(ROOT, 'openblog/events');

export function normalizeCategoryKey(category: string): string {
  return category.trim().toLowerCase().replace(/[\s_]+/g, '-');
}

export function formatCategoryLabel(category: string): string {
  return normalizeCategoryKey(category)
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function getCategoryPath(category: string): string {
  return `/categories/${encodeURIComponent(normalizeCategoryKey(category))}`;
}

function normalizeUsernameHandle(username: string): string {
  return username.trim().replace(/^@+/, '');
}

export function getProfilePath(username: string): string {
  return `/profile/@${normalizeUsernameHandle(username)}`;
}

function toDateString(value: unknown): string {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '' : value.toISOString().slice(0, 10);
  }

  if (typeof value === 'string') {
    const dateValue = value.trim();
    if (!dateValue) return '';

    const isoPrefix = dateValue.match(/^(\d{4}-\d{2}-\d{2})/);
    if (isoPrefix) return isoPrefix[1];

    const parsed = new Date(dateValue);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }

    return dateValue;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
  }

  return '';
}

export function formatPostDate(value: unknown): string {
  return toDateString(value);
}

function resolvePostSlug(postSlug: string, availableSlugs: Set<string>): string | null {
  const raw = postSlug.trim().replace(/\\/g, '/');
  if (!raw) return null;

  const candidates = new Set<string>([raw]);
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

function normalizeEventContribution(raw: unknown): EventContributionRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const candidate = raw as Partial<EventContributionRecord>;
  if (typeof candidate.postSlug !== 'string' || !candidate.postSlug.trim()) return null;
  const labels = Array.isArray(candidate.labels) ? candidate.labels.filter((label): label is string => typeof label === 'string') : [];
  const points = typeof candidate.points === 'number' && Number.isFinite(candidate.points) ? candidate.points : 0;
  return {
    postSlug: candidate.postSlug,
    points,
    labels
  };
}

function getEventContributions(event: RawEventRecord): EventContributionRecord[] {
  if (Array.isArray(event.contributions) && event.contributions.length > 0) {
    return event.contributions
      .map((item) => normalizeEventContribution(item))
      .filter((item): item is EventContributionRecord => item !== null);
  }

  if (typeof event.postSlug === 'string' && event.postSlug.trim()) {
    const labels = Array.isArray(event.labels) ? event.labels.filter((label): label is string => typeof label === 'string') : [];
    const points = typeof event.points === 'number' && Number.isFinite(event.points) ? event.points : 0;
    return [{ postSlug: event.postSlug, points, labels }];
  }

  return [];
}

export function getPosts(): Post[] {
  if (!fs.existsSync(POSTS_DIR)) return [];

  const entries = fs.readdirSync(POSTS_DIR, { withFileTypes: true });
  const rootMarkdownFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.md'));
  if (rootMarkdownFiles.length > 0) {
    const fileList = rootMarkdownFiles.map((file) => file.name).join(', ');
    throw new Error(`Posts must be stored under content/posts/<category>/<post>.md. Move: ${fileList}`);
  }

  const posts: Post[] = [];

  for (const categoryEntry of entries) {
    if (!categoryEntry.isDirectory()) continue;

    const rawCategory = categoryEntry.name;
    const category = normalizeCategoryKey(rawCategory);
    const categoryLabel = formatCategoryLabel(rawCategory);
    const categoryDir = path.join(POSTS_DIR, rawCategory);
    for (const postEntry of fs.readdirSync(categoryDir, { withFileTypes: true })) {
      if (postEntry.isDirectory()) {
        throw new Error(
          `Nested folders are not supported in content/posts. Found: ${rawCategory}/${postEntry.name}`
        );
      }

      if (!postEntry.isFile() || !postEntry.name.endsWith('.md')) continue;

      const postPath = path.join(categoryDir, postEntry.name);
      const raw = fs.readFileSync(postPath, 'utf8');
      const { data, content } = matter(raw);
      const postName = postEntry.name.replace(/\.md$/, '');
      posts.push({
        slug: `${rawCategory}/${postName}`,
        category,
        categoryLabel,
        title: data.title ?? postName,
        description: data.description ?? '',
        date: toDateString(data.date),
        body: content.trim()
      });
    }
  }

  return posts.sort((a, b) => b.date.localeCompare(a.date));
}

export function getPostBySlug(slug: string): Post | undefined {
  return getPosts().find((post) => post.slug === slug);
}

export function getLeaderboard(): UserRecord[] {
  const p = path.join(ROOT, 'openblog/generated/leaderboard.json');
  if (!fs.existsSync(p)) return [];
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  return data.leaderboard ?? [];
}

export function getCategoryLeaderboard(category: string): CategoryLeaderboardRecord[] {
  const normalizedCategory = normalizeCategoryKey(category);
  const categoryLeaderboardPath = path.join(GENERATED_CATEGORIES_DIR, `${normalizedCategory}.json`);
  if (!fs.existsSync(categoryLeaderboardPath)) return [];

  const data = JSON.parse(fs.readFileSync(categoryLeaderboardPath, 'utf8'));
  if (!Array.isArray(data.leaderboard)) return [];

  return data.leaderboard
    .filter((entry): entry is CategoryLeaderboardRecord =>
      Boolean(entry) &&
      typeof entry === 'object' &&
      typeof entry.username === 'string' &&
      typeof entry.totalPoints === 'number' &&
      typeof entry.acceptedPrs === 'number' &&
      typeof entry.totalContributions === 'number' &&
      typeof entry.totalPostsContributed === 'number'
    );
}

export function getUserPostContributionCounts(): Record<string, number> {
  if (!fs.existsSync(EVENTS_DIR)) return {};

  const counts: Record<string, number> = {};

  for (const file of fs.readdirSync(EVENTS_DIR)) {
    if (!file.endsWith('.json')) continue;

    const event = JSON.parse(fs.readFileSync(path.join(EVENTS_DIR, file), 'utf8')) as RawEventRecord;
    if (!event.username) continue;

    const contributions = getEventContributions(event);
    if (contributions.length === 0) continue;

    counts[event.username] = (counts[event.username] ?? 0) + contributions.length;
  }

  return counts;
}

export function getKnownContributors(): string[] {
  const byLowercase = new Map<string, string>();

  for (const user of getLeaderboard()) {
    byLowercase.set(user.username.toLowerCase(), user.username);
  }

  if (fs.existsSync(EVENTS_DIR)) {
    for (const file of fs.readdirSync(EVENTS_DIR)) {
      if (!file.endsWith('.json')) continue;
      const event = JSON.parse(fs.readFileSync(path.join(EVENTS_DIR, file), 'utf8')) as RawEventRecord;
      if (!event.username) continue;
      const key = event.username.toLowerCase();
      if (!byLowercase.has(key)) {
        byLowercase.set(key, event.username);
      }
    }
  }

  return [...byLowercase.values()].sort((a, b) => a.localeCompare(b));
}

export function getUserProfile(usernameOrHandle: string): UserProfileRecord | null {
  const normalizedInput = normalizeUsernameHandle(usernameOrHandle);
  if (!normalizedInput) return null;

  const normalizedLookup = normalizedInput.toLowerCase();
  const leaderboardEntry = getLeaderboard().find((entry) => entry.username.toLowerCase() === normalizedLookup);

  const posts = getPosts();
  const postBySlug = new Map(posts.map((post) => [post.slug, post]));
  const knownSlugs = new Set(posts.map((post) => post.slug));

  if (!fs.existsSync(EVENTS_DIR) && !leaderboardEntry) return null;

  let canonicalUsername = leaderboardEntry?.username ?? normalizedInput;
  let avatarUrl = leaderboardEntry?.avatarUrl ?? null;
  let joinedAt: string | null = null;
  let lastContributionAt: string | null = null;
  let calculatedTotalPoints = 0;
  let totalContributions = 0;
  const acceptedPrNumbers = new Set<number>();
  const contributionsByPost = new Map<string, {
    postSlug: string;
    totalPoints: number;
    contributions: number;
    acceptedPrNumbers: Set<number>;
    firstContributedAt: string;
    lastContributedAt: string;
  }>();

  if (fs.existsSync(EVENTS_DIR)) {
    for (const file of fs.readdirSync(EVENTS_DIR)) {
      if (!file.endsWith('.json')) continue;

      const event = JSON.parse(fs.readFileSync(path.join(EVENTS_DIR, file), 'utf8')) as RawEventRecord;
      if (!event.username || !event.mergedAt || !Number.isFinite(event.prNumber)) continue;
      if (event.username.toLowerCase() !== normalizedLookup) continue;

      canonicalUsername = event.username;
      if (event.userAvatarUrl) {
        avatarUrl = event.userAvatarUrl;
      }

      const contributions = getEventContributions(event);
      if (contributions.length === 0) continue;

      if (!joinedAt || event.mergedAt < joinedAt) {
        joinedAt = event.mergedAt;
      }
      if (!lastContributionAt || event.mergedAt > lastContributionAt) {
        lastContributionAt = event.mergedAt;
      }

      acceptedPrNumbers.add(event.prNumber);
      for (const contribution of contributions) {
        const resolvedPostSlug = resolvePostSlug(contribution.postSlug, knownSlugs) ?? contribution.postSlug;
        const current = contributionsByPost.get(resolvedPostSlug) ?? {
          postSlug: resolvedPostSlug,
          totalPoints: 0,
          contributions: 0,
          acceptedPrNumbers: new Set<number>(),
          firstContributedAt: event.mergedAt,
          lastContributedAt: event.mergedAt
        };

        current.totalPoints += contribution.points;
        current.contributions += 1;
        current.acceptedPrNumbers.add(event.prNumber);
        if (event.mergedAt < current.firstContributedAt) {
          current.firstContributedAt = event.mergedAt;
        }
        if (event.mergedAt > current.lastContributedAt) {
          current.lastContributedAt = event.mergedAt;
        }

        contributionsByPost.set(resolvedPostSlug, current);
        calculatedTotalPoints += contribution.points;
        totalContributions += 1;
      }
    }
  }

  const hasEventData = acceptedPrNumbers.size > 0 || totalContributions > 0;
  const contributedPosts = [...contributionsByPost.values()]
    .map((entry) => {
      const post = postBySlug.get(entry.postSlug);
      return {
        postSlug: entry.postSlug,
        postTitle: post?.title ?? entry.postSlug,
        postExists: Boolean(post),
        totalPoints: entry.totalPoints,
        contributions: entry.contributions,
        acceptedPrNumbers: [...entry.acceptedPrNumbers].sort((a, b) => b - a),
        firstContributedAt: entry.firstContributedAt,
        lastContributedAt: entry.lastContributedAt
      } satisfies UserContributedPostRecord;
    })
    .sort(
      (a, b) =>
        b.lastContributedAt.localeCompare(a.lastContributedAt) ||
        b.totalPoints - a.totalPoints ||
        a.postSlug.localeCompare(b.postSlug)
    );

  if (!hasEventData && !leaderboardEntry) return null;

  return {
    username: canonicalUsername,
    profileUrl: `https://github.com/${canonicalUsername}`,
    avatarUrl,
    totalPoints: hasEventData ? calculatedTotalPoints : (leaderboardEntry?.totalPoints ?? 0),
    acceptedPrs: hasEventData ? acceptedPrNumbers.size : (leaderboardEntry?.acceptedPrs ?? 0),
    acceptedPrNumbers: [...acceptedPrNumbers].sort((a, b) => b - a),
    postsContributed: contributedPosts.length,
    totalContributions,
    joinedAt,
    lastContributionAt,
    contributedPosts
  };
}

export function getContributorsForPost(postSlug: string): PostContributorRecord[] {
  if (!fs.existsSync(EVENTS_DIR)) return [];
  const knownSlugs = new Set(getPosts().map((post) => post.slug));

  const byUser = new Map<string, {
    avatarUrl: string | null;
    totalPoints: number;
    acceptedPrs: number;
    acceptedPrNumbers: Set<number>;
    labels: Set<string>;
    pullRequestsByNumber: Map<number, {
      prNumber: number;
      points: number;
      labels: Set<string>;
      mergedAt: string;
    }>;
  }>();

  for (const file of fs.readdirSync(EVENTS_DIR)) {
    if (!file.endsWith('.json')) continue;
    const event = JSON.parse(fs.readFileSync(path.join(EVENTS_DIR, file), 'utf8')) as RawEventRecord;
    if (!event.username || !event.mergedAt || !Number.isFinite(event.prNumber)) continue;
    const contributions = getEventContributions(event);

    const current = byUser.get(event.username) ?? {
      avatarUrl: null,
      totalPoints: 0,
      acceptedPrs: 0,
      acceptedPrNumbers: new Set<number>(),
      labels: new Set<string>(),
      pullRequestsByNumber: new Map<number, {
        prNumber: number;
        points: number;
        labels: Set<string>;
        mergedAt: string;
      }>()
    };

    if (event.userAvatarUrl) {
      current.avatarUrl = event.userAvatarUrl;
    }

    let matchedContribution = false;
    for (const contribution of contributions) {
      const resolvedPostSlug = resolvePostSlug(contribution.postSlug, knownSlugs);
      if (resolvedPostSlug !== postSlug) continue;
      matchedContribution = true;

      current.totalPoints += contribution.points;
      current.acceptedPrNumbers.add(event.prNumber);
      current.acceptedPrs = current.acceptedPrNumbers.size;
      contribution.labels.forEach((label) => current.labels.add(label));

      const existingPullRequest = current.pullRequestsByNumber.get(event.prNumber);
      if (existingPullRequest) {
        existingPullRequest.points += contribution.points;
        contribution.labels.forEach((label) => existingPullRequest.labels.add(label));
        if (event.mergedAt > existingPullRequest.mergedAt) {
          existingPullRequest.mergedAt = event.mergedAt;
        }
      } else {
        current.pullRequestsByNumber.set(event.prNumber, {
          prNumber: event.prNumber,
          points: contribution.points,
          labels: new Set<string>(contribution.labels),
          mergedAt: event.mergedAt
        });
      }
    }
    if (matchedContribution || byUser.has(event.username)) {
      byUser.set(event.username, current);
    }
  }

  return [...byUser.entries()]
    .map(([username, info]) => ({
      username,
      avatarUrl: info.avatarUrl,
      totalPoints: info.totalPoints,
      acceptedPrs: info.acceptedPrs,
      labels: [...info.labels].sort((a, b) => a.localeCompare(b)),
      pullRequests: [...info.pullRequestsByNumber.values()]
        .map((pullRequest) => ({
          prNumber: pullRequest.prNumber,
          points: pullRequest.points,
          labels: [...pullRequest.labels].sort((a, b) => a.localeCompare(b)),
          mergedAt: pullRequest.mergedAt
        }))
        .sort((a, b) => b.mergedAt.localeCompare(a.mergedAt))
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints || b.acceptedPrs - a.acceptedPrs || a.username.localeCompare(b.username));
}

export function getRecentEvents(limit = 10): EventRecord[] {
  if (!fs.existsSync(EVENTS_DIR)) return [];
  const knownSlugs = new Set(getPosts().map((post) => post.slug));

  return fs
    .readdirSync(EVENTS_DIR)
    .filter((file) => file.endsWith('.json'))
    .flatMap((file) => {
      const event = JSON.parse(fs.readFileSync(path.join(EVENTS_DIR, file), 'utf8')) as RawEventRecord;
      if (!event.username || !event.mergedAt || !Number.isFinite(event.prNumber)) return [];
      return getEventContributions(event).map((contribution) => {
        const resolvedPostSlug = resolvePostSlug(contribution.postSlug, knownSlugs) ?? contribution.postSlug;
        return {
          prNumber: event.prNumber,
          username: event.username,
          userAvatarUrl: event.userAvatarUrl,
          postSlug: resolvedPostSlug,
          points: contribution.points,
          labels: contribution.labels,
          mergedAt: event.mergedAt
        } satisfies EventRecord;
      });
    })
    .sort((a, b) => b.mergedAt.localeCompare(a.mergedAt))
    .slice(0, limit);
}

type GeneratedUserRecord = {
  username: string;
  profileUrl?: string;
  avatarUrl?: string | null;
  lastUpdatedAt?: string;
  lastContribution?: { mergedAt?: string } | null;
};

export function getLatestContributors(limit = 8): LatestContributorRecord[] {
  const users: LatestContributorRecord[] = [];
  if (fs.existsSync(GENERATED_USERS_DIR)) {
    for (const file of fs.readdirSync(GENERATED_USERS_DIR)) {
      if (!file.endsWith('.json')) continue;

      const raw = JSON.parse(fs.readFileSync(path.join(GENERATED_USERS_DIR, file), 'utf8')) as GeneratedUserRecord;
      if (!raw.username) continue;

      const lastContributionAt = raw.lastContribution?.mergedAt ?? raw.lastUpdatedAt;
      if (!lastContributionAt) continue;

      users.push({
        username: raw.username,
        profileUrl: raw.profileUrl ?? `https://github.com/${raw.username}`,
        avatarUrl: raw.avatarUrl ?? null,
        lastContributionAt
      });
    }
  } else if (fs.existsSync(EVENTS_DIR)) {
    const latestByUser = new Map<string, LatestContributorRecord>();
    for (const file of fs.readdirSync(EVENTS_DIR)) {
      if (!file.endsWith('.json')) continue;
      const event = JSON.parse(fs.readFileSync(path.join(EVENTS_DIR, file), 'utf8')) as RawEventRecord;
      if (!event.username || !event.mergedAt) continue;

      const current = latestByUser.get(event.username);
      if (!current || event.mergedAt > current.lastContributionAt) {
        latestByUser.set(event.username, {
          username: event.username,
          profileUrl: `https://github.com/${event.username}`,
          avatarUrl: event.userAvatarUrl ?? null,
          lastContributionAt: event.mergedAt
        });
      }
    }
    users.push(...latestByUser.values());
  }

  return users
    .sort((a, b) => b.lastContributionAt.localeCompare(a.lastContributionAt) || a.username.localeCompare(b.username))
    .slice(0, limit);
}

export function getLatestContributorsForPost(postSlug: string, limit = 5): LatestContributorRecord[] {
  if (!fs.existsSync(EVENTS_DIR)) return [];
  const knownSlugs = new Set(getPosts().map((post) => post.slug));
  const latestByUser = new Map<string, LatestContributorRecord>();

  for (const file of fs.readdirSync(EVENTS_DIR)) {
    if (!file.endsWith('.json')) continue;
    const event = JSON.parse(fs.readFileSync(path.join(EVENTS_DIR, file), 'utf8')) as RawEventRecord;
    if (!event.username || !event.mergedAt) continue;

    const hasContributionForPost = getEventContributions(event).some((contribution) => {
      const resolvedPostSlug = resolvePostSlug(contribution.postSlug, knownSlugs);
      return resolvedPostSlug === postSlug;
    });
    if (!hasContributionForPost) continue;

    const current = latestByUser.get(event.username);
    if (!current || event.mergedAt > current.lastContributionAt) {
      latestByUser.set(event.username, {
        username: event.username,
        profileUrl: `https://github.com/${event.username}`,
        avatarUrl: event.userAvatarUrl ?? null,
        lastContributionAt: event.mergedAt
      });
    }
  }

  return [...latestByUser.values()]
    .sort((a, b) => b.lastContributionAt.localeCompare(a.lastContributionAt) || a.username.localeCompare(b.username))
    .slice(0, limit);
}
