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
  if (availableSlugs.has(postSlug)) return postSlug;
  if (postSlug.includes('/')) return null;

  const matches = [...availableSlugs].filter((slug) => slug.endsWith(`/${postSlug}`));
  return matches.length === 1 ? matches[0] : null;
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

export function getContributorsForPost(postSlug: string): PostContributorRecord[] {
  if (!fs.existsSync(EVENTS_DIR)) return [];
  const knownSlugs = new Set(getPosts().map((post) => post.slug));

  const byUser = new Map<string, {
    avatarUrl: string | null;
    totalPoints: number;
    acceptedPrs: number;
    labels: Set<string>;
    pullRequests: PostContributorPrRecord[];
  }>();

  for (const file of fs.readdirSync(EVENTS_DIR)) {
    if (!file.endsWith('.json')) continue;
    const event: EventRecord = JSON.parse(fs.readFileSync(path.join(EVENTS_DIR, file), 'utf8'));
    const resolvedPostSlug = resolvePostSlug(event.postSlug, knownSlugs);
    if (resolvedPostSlug !== postSlug) continue;

    const current = byUser.get(event.username) ?? {
      avatarUrl: null,
      totalPoints: 0,
      acceptedPrs: 0,
      labels: new Set<string>(),
      pullRequests: []
    };

    if (event.userAvatarUrl) {
      current.avatarUrl = event.userAvatarUrl;
    }

    current.totalPoints += event.points;
    current.acceptedPrs += 1;
    event.labels.forEach((label) => current.labels.add(label));
    current.pullRequests.push({
      prNumber: event.prNumber,
      points: event.points,
      labels: [...event.labels].sort((a, b) => a.localeCompare(b)),
      mergedAt: event.mergedAt
    });
    byUser.set(event.username, current);
  }

  return [...byUser.entries()]
    .map(([username, info]) => ({
      username,
      avatarUrl: info.avatarUrl,
      totalPoints: info.totalPoints,
      acceptedPrs: info.acceptedPrs,
      labels: [...info.labels].sort((a, b) => a.localeCompare(b)),
      pullRequests: info.pullRequests.sort((a, b) => b.mergedAt.localeCompare(a.mergedAt))
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints || b.acceptedPrs - a.acceptedPrs || a.username.localeCompare(b.username));
}

export function getRecentEvents(limit = 10): EventRecord[] {
  if (!fs.existsSync(EVENTS_DIR)) return [];
  const knownSlugs = new Set(getPosts().map((post) => post.slug));

  return fs
    .readdirSync(EVENTS_DIR)
    .filter((file) => file.endsWith('.json'))
    .map((file) => JSON.parse(fs.readFileSync(path.join(EVENTS_DIR, file), 'utf8')) as EventRecord)
    .map((event) => {
      const resolvedPostSlug = resolvePostSlug(event.postSlug, knownSlugs);
      if (!resolvedPostSlug) return event;
      return { ...event, postSlug: resolvedPostSlug };
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
      const event = JSON.parse(fs.readFileSync(path.join(EVENTS_DIR, file), 'utf8')) as EventRecord;
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
    const event = JSON.parse(fs.readFileSync(path.join(EVENTS_DIR, file), 'utf8')) as EventRecord;
    const resolvedPostSlug = resolvePostSlug(event.postSlug, knownSlugs);
    if (resolvedPostSlug !== postSlug || !event.username || !event.mergedAt) continue;

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
