import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

export type Post = {
  slug: string;
  category: string;
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

type PostContributorRecord = UserRecord & { labels: string[] };

const ROOT = process.cwd();
const POSTS_DIR = path.join(ROOT, 'content/posts');

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

    const category = categoryEntry.name;
    const categoryDir = path.join(POSTS_DIR, category);
    for (const postEntry of fs.readdirSync(categoryDir, { withFileTypes: true })) {
      if (postEntry.isDirectory()) {
        throw new Error(
          `Nested folders are not supported in content/posts. Found: ${category}/${postEntry.name}`
        );
      }

      if (!postEntry.isFile() || !postEntry.name.endsWith('.md')) continue;

      const postPath = path.join(categoryDir, postEntry.name);
      const raw = fs.readFileSync(postPath, 'utf8');
      const { data, content } = matter(raw);
      const postName = postEntry.name.replace(/\.md$/, '');
      posts.push({
        slug: `${category}/${postName}`,
        category,
        title: data.title ?? postName,
        description: data.description ?? '',
        date: data.date ?? '',
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
  const p = path.join(ROOT, 'game/generated/leaderboard.json');
  if (!fs.existsSync(p)) return [];
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  return data.leaderboard ?? [];
}

export function getContributorsForPost(postSlug: string): PostContributorRecord[] {
  const eventsDir = path.join(ROOT, 'game/events');
  if (!fs.existsSync(eventsDir)) return [];
  const knownSlugs = new Set(getPosts().map((post) => post.slug));

  const byUser = new Map<string, { avatarUrl: string | null; totalPoints: number; acceptedPrs: number; labels: Set<string> }>();

  for (const file of fs.readdirSync(eventsDir)) {
    if (!file.endsWith('.json')) continue;
    const event: EventRecord = JSON.parse(fs.readFileSync(path.join(eventsDir, file), 'utf8'));
    const resolvedPostSlug = resolvePostSlug(event.postSlug, knownSlugs);
    if (resolvedPostSlug !== postSlug) continue;

    const current = byUser.get(event.username) ?? {
      avatarUrl: null,
      totalPoints: 0,
      acceptedPrs: 0,
      labels: new Set<string>()
    };

    if (event.userAvatarUrl) {
      current.avatarUrl = event.userAvatarUrl;
    }

    current.totalPoints += event.points;
    current.acceptedPrs += 1;
    event.labels.forEach((label) => current.labels.add(label));
    byUser.set(event.username, current);
  }

  return [...byUser.entries()]
    .map(([username, info]) => ({
      username,
      avatarUrl: info.avatarUrl,
      totalPoints: info.totalPoints,
      acceptedPrs: info.acceptedPrs,
      labels: [...info.labels].sort((a, b) => a.localeCompare(b))
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints || b.acceptedPrs - a.acceptedPrs || a.username.localeCompare(b.username));
}

export function getRecentEvents(limit = 10): EventRecord[] {
  const eventsDir = path.join(ROOT, 'game/events');
  if (!fs.existsSync(eventsDir)) return [];
  const knownSlugs = new Set(getPosts().map((post) => post.slug));

  return fs
    .readdirSync(eventsDir)
    .filter((file) => file.endsWith('.json'))
    .map((file) => JSON.parse(fs.readFileSync(path.join(eventsDir, file), 'utf8')) as EventRecord)
    .map((event) => {
      const resolvedPostSlug = resolvePostSlug(event.postSlug, knownSlugs);
      if (!resolvedPostSlug) return event;
      return { ...event, postSlug: resolvedPostSlug };
    })
    .sort((a, b) => b.mergedAt.localeCompare(a.mergedAt))
    .slice(0, limit);
}
