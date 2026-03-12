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

type PostContributorRecord = UserRecord & { labels: string[] };

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

export function getContributorsForPost(postSlug: string): PostContributorRecord[] {
  const eventsDir = path.join(ROOT, 'game/events');
  if (!fs.existsSync(eventsDir)) return [];

  const byUser = new Map<string, { totalPoints: number; acceptedPrs: number; labels: Set<string> }>();

  for (const file of fs.readdirSync(eventsDir)) {
    if (!file.endsWith('.json')) continue;
    const event: EventRecord = JSON.parse(fs.readFileSync(path.join(eventsDir, file), 'utf8'));
    if (event.postSlug !== postSlug) continue;

    const current = byUser.get(event.username) ?? {
      totalPoints: 0,
      acceptedPrs: 0,
      labels: new Set<string>()
    };

    current.totalPoints += event.points;
    current.acceptedPrs += 1;
    event.labels.forEach((label) => current.labels.add(label));
    byUser.set(event.username, current);
  }

  return [...byUser.entries()]
    .map(([username, info]) => ({
      username,
      totalPoints: info.totalPoints,
      acceptedPrs: info.acceptedPrs,
      labels: [...info.labels].sort((a, b) => a.localeCompare(b))
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints || b.acceptedPrs - a.acceptedPrs || a.username.localeCompare(b.username));
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
