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

const POSTS_ROOT = path.join(process.cwd(), 'content/posts');

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

function walkMarkdownFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkMarkdownFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.md')) files.push(full);
  }
  return files;
}

function loadPost(filePath: string): Post | null {
  const relative = path.relative(POSTS_ROOT, filePath).replace(/\\/g, '/');
  const slug = relative.replace(/\.md$/, '');
  const category = slug.split('/')[0] ?? 'posts';
  const raw = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(raw);
  const draft = Boolean(data.draft);
  if (draft) return null;

  return {
    slug,
    category,
    categoryLabel: humanize(category),
    title: String(data.title ?? humanize(path.basename(slug))),
    description: String(data.description ?? ''),
    date: String(data.date ?? '1970-01-01'),
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
  if (cachedPosts) return cachedPosts;
  const posts = walkMarkdownFiles(POSTS_ROOT)
    .map(loadPost)
    .filter((post): post is Post => Boolean(post))
    .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
  cachedPosts = posts;
  return posts;
}

export function getCategoryPath(category: string): string {
  return `/categories/${encodeURIComponent(category)}`;
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
