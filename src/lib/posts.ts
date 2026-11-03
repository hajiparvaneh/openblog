import path from 'node:path';
import matter from 'gray-matter';

export type Post = {
  slug: string;
  category: string;
  categoryLabel: string;
  title: string;
  description: string;
  date: string;
  thumbnail?: string;
  thumbnailAlt?: string;
  tags: string[];
  draft: boolean;
  featured: boolean;
  lang: string;
  body: string;
};

export type TagRecord = {
  slug: string;
  label: string;
  postCount: number;
};

// Vite tracks these files so `astro dev` refreshes routes when Markdown is added/changed.
const postFiles = import.meta.glob('../../content/posts/**/*.md', {
  eager: true,
  query: '?raw',
  import: 'default'
}) as Record<string, string>;

function humanize(value: string): string {
  return value
    .split(/[-_/]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function slugifyTag(tag: string): string {
  return tag
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function normalizeTags(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((tag) => String(tag).trim()).filter(Boolean);
  }
  if (typeof raw === 'string') {
    return raw
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeDate(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'string' && value.trim()) {
    const trimmed = value.trim();
    const parsed = new Date(trimmed);
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
    return trimmed;
  }
  return '1970-01-01';
}

function slugFromGlobKey(key: string): string {
  const normalized = key.replace(/\\/g, '/');
  const marker = '/content/posts/';
  const index = normalized.lastIndexOf(marker);
  const relative = index >= 0 ? normalized.slice(index + marker.length) : path.basename(normalized);
  return relative.replace(/\.md$/i, '');
}

function loadPost(slug: string, raw: string): Post | null {
  const category = slug.split('/')[0] ?? 'posts';
  const { data, content } = matter(raw);
  if (Boolean(data.draft)) return null;

  return {
    slug,
    category,
    categoryLabel: humanize(category),
    title: String(data.title ?? humanize(path.basename(slug))),
    description: String(data.description ?? ''),
    date: normalizeDate(data.date),
    thumbnail: data.thumbnail ? String(data.thumbnail) : undefined,
    thumbnailAlt: data.thumbnailAlt ? String(data.thumbnailAlt) : undefined,
    tags: normalizeTags(data.tags),
    draft: false,
    featured: Boolean(data.featured),
    lang: String(data.lang ?? 'en'),
    body: content.trim()
  };
}

let cachedPosts: Post[] | null = null;

export function getPosts(): Post[] {
  if (import.meta.env.PROD && cachedPosts) return cachedPosts;
  const posts = Object.entries(postFiles)
    .map(([filePath, raw]) => loadPost(slugFromGlobKey(filePath), raw))
    .filter((post): post is Post => Boolean(post))
    .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
  if (import.meta.env.PROD) cachedPosts = posts;
  return posts;
}

export function getPostBySlug(slug: string): Post | undefined {
  const normalized = slug.replace(/^\/+|\/+$/g, '');
  return getPosts().find((post) => post.slug === normalized);
}

export function normalizeCategoryKey(category: string): string {
  return category.trim().toLowerCase().replace(/\s+/g, '-');
}

export function getCategoryPath(category: string): string {
  return `/categories/${encodeURIComponent(normalizeCategoryKey(category))}`;
}

export function getTagPath(tag: string): string {
  return `/tag/${encodeURIComponent(slugifyTag(tag))}`;
}

export function getTagPathBySlug(tagSlug: string): string {
  return `/tag/${encodeURIComponent(slugifyTag(tagSlug))}`;
}

export function getTagRecords(): TagRecord[] {
  const counts = new Map<string, TagRecord>();
  for (const post of getPosts()) {
    for (const tag of post.tags) {
      const slug = slugifyTag(tag);
      const current = counts.get(slug);
      if (current) current.postCount += 1;
      else counts.set(slug, { slug, label: tag, postCount: 1 });
    }
  }
  return [...counts.values()].sort((a, b) => b.postCount - a.postCount || a.label.localeCompare(b.label));
}

export function getTagLabelBySlug(tagSlug: string): string | undefined {
  const normalizedTagSlug = slugifyTag(tagSlug);
  if (!normalizedTagSlug) return undefined;
  return getTagRecords().find((tag) => tag.slug === normalizedTagSlug)?.label;
}

export function getPostsByTagSlug(tagSlug: string): Post[] {
  const normalized = slugifyTag(tagSlug);
  return getPosts().filter((post) => post.tags.some((tag) => slugifyTag(tag) === normalized));
}

export function formatPostDate(date: string): string {
  return date;
}

export function getPostPath(slug: string): string {
  return `/posts/${slug.split('/').map((segment) => encodeURIComponent(segment)).join('/')}`;
}
