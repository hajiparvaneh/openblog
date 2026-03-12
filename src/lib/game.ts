import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

export type Post = {
  slug: string;
  title: string;
  description: string;
  date: string;
  body: string;
};

type EventRecord = {
  prNumber: number;
  username: string;
  postSlug: string;
  points: number;
  labels: string[];
  mergedAt: string;
};

type UserRecord = { username: string; totalPoints: number; acceptedPrs: number };

const ROOT = process.cwd();

export function getPosts(): Post[] {
  const postsDir = path.join(ROOT, 'content/posts');
  return fs
    .readdirSync(postsDir)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const raw = fs.readFileSync(path.join(postsDir, file), 'utf8');
      const { data, content } = matter(raw);
      return {
        slug: file.replace(/\.md$/, ''),
        title: data.title ?? file,
        description: data.description ?? '',
        date: data.date ?? '',
        body: content.trim()
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
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

export function getContributorsForPost(postSlug: string): Array<UserRecord & { labels: string[] }> {
  const eventsDir = path.join(ROOT, 'game/events');
  const userPoints = new Map(getLeaderboard().map((u) => [u.username, u.totalPoints]));
  if (!fs.existsSync(eventsDir)) return [];

  const byUser = new Map<string, { labels: Set<string> }>();

  for (const file of fs.readdirSync(eventsDir)) {
    if (!file.endsWith('.json')) continue;
    const event: EventRecord = JSON.parse(fs.readFileSync(path.join(eventsDir, file), 'utf8'));
    if (event.postSlug !== postSlug) continue;
    if (!byUser.has(event.username)) byUser.set(event.username, { labels: new Set() });
    event.labels.forEach((label) => byUser.get(event.username)?.labels.add(label));
  }

  return [...byUser.entries()].map(([username, info]) => ({
    username,
    totalPoints: userPoints.get(username) ?? 0,
    acceptedPrs: 0,
    labels: [...info.labels]
  }));
}

export function getRecentEvents(limit = 10): EventRecord[] {
  const eventsDir = path.join(ROOT, 'game/events');
  if (!fs.existsSync(eventsDir)) return [];

  return fs
    .readdirSync(eventsDir)
    .filter((file) => file.endsWith('.json'))
    .map((file) => JSON.parse(fs.readFileSync(path.join(eventsDir, file), 'utf8')) as EventRecord)
    .sort((a, b) => b.mergedAt.localeCompare(a.mergedAt))
    .slice(0, limit);
}
