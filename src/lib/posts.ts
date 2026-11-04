import path from 'node:path';
import matter from 'gray-matter';
import { normalizePost, slugify as slugifyTag, type NormalizedPost } from './post-model.mjs';
import { getOpenBlogConfig, type OpenBlogConfig } from './site';

export type Post = NormalizedPost & {
  translateOfSlug?: string;
};

export type AuthorCredit = {
  name: string;
  url?: string;
  avatar?: string;
};

export type TagRecord = {
  slug: string;
  label: string;
  postCount: number;
};

export type SeriesRecord = {
  slug: string;
  title: string;
  postCount: number;
  latestDate: string;
};

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  fa: 'فارسی',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
  ar: 'العربية',
  zh: '中文',
  ja: '日本語',
  pt: 'Português',
  ru: 'Русский',
  tr: 'Türkçe',
  nl: 'Nederlands',
  it: 'Italiano',
  ko: '한국어',
  hi: 'हिन्दी'
};

// Vite tracks these files so `astro dev` refreshes routes when Markdown is added/changed.
const postFiles = import.meta.glob('../../content/posts/**/*.md', {
  eager: true,
  query: '?raw',
  import: 'default'
}) as Record<string, string>;

export { slugifyTag };

function slugFromGlobKey(key: string): string {
  const normalized = key.replace(/\\/g, '/');
  const marker = '/content/posts/';
  const index = normalized.lastIndexOf(marker);
  const relative = index >= 0 ? normalized.slice(index + marker.length) : path.basename(normalized);
  return relative.replace(/\.md$/i, '');
}

function attachTranslations(posts: Post[]): Post[] {
  const slugs = new Set(posts.map((post) => post.slug));
  return posts.map((post) => {
    if (!post.translateOfFile) return post;
    const target = `${post.category}/${post.translateOfFile.replace(/\.md$/i, '')}`;
    if (!slugs.has(target) || target === post.slug) return post;
    return { ...post, translateOfSlug: target };
  });
}

let cachedPosts: Post[] | null = null;

export function getPosts(): Post[] {
  if (import.meta.env.PROD && cachedPosts) return cachedPosts;
  const posts = attachTranslations(
    Object.entries(postFiles)
      .map(([filePath, raw]) => {
        const parsed = matter(raw);
        return normalizePost(slugFromGlobKey(filePath), parsed.data, parsed.content);
      })
      .filter((post) => !post.draft)
  ).sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
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

export function getSeriesPath(seriesSlug: string): string {
  return `/series/${encodeURIComponent(seriesSlug)}`;
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

export function getSeriesPosts(seriesSlug: string): Post[] {
  return getPosts()
    .filter((post) => post.seriesSlug === seriesSlug)
    .sort(
      (a, b) =>
        (a.seriesOrder ?? 9999) - (b.seriesOrder ?? 9999) ||
        a.date.localeCompare(b.date) ||
        a.slug.localeCompare(b.slug)
    );
}

export function getSeriesList(): SeriesRecord[] {
  const series = new Map<string, SeriesRecord>();
  for (const post of getPosts()) {
    if (!post.seriesSlug || !post.series) continue;
    const current = series.get(post.seriesSlug);
    if (!current) {
      series.set(post.seriesSlug, {
        slug: post.seriesSlug,
        title: post.series,
        postCount: 1,
        latestDate: post.updated ?? post.date
      });
      continue;
    }
    current.postCount += 1;
    const stamp = post.updated ?? post.date;
    if (stamp > current.latestDate) current.latestDate = stamp;
  }
  return [...series.values()].sort((a, b) => b.latestDate.localeCompare(a.latestDate) || a.title.localeCompare(b.title));
}

export function getSeriesBySlug(seriesSlug: string): SeriesRecord | undefined {
  return getSeriesList().find((series) => series.slug === seriesSlug);
}

function translationRoot(post: Post, bySlug: Map<string, Post>, seen = new Set<string>()): string {
  if (seen.has(post.slug)) return post.slug;
  seen.add(post.slug);
  if (!post.translateOfSlug) return post.slug;
  const target = bySlug.get(post.translateOfSlug);
  if (!target) return post.slug;
  return translationRoot(target, bySlug, seen);
}

export function getTranslationGroup(post: Post): Post[] {
  const posts = getPosts();
  const bySlug = new Map(posts.map((entry) => [entry.slug, entry]));
  const root = translationRoot(post, bySlug);
  return posts
    .filter((entry) => translationRoot(entry, bySlug) === root)
    .sort((a, b) => a.lang.localeCompare(b.lang) || a.slug.localeCompare(b.slug));
}

export function getRelatedPosts(post: Post, limit = 3): Post[] {
  const excluded = new Set(getTranslationGroup(post).map((entry) => entry.slug));
  const tags = new Set(post.tags.map((tag) => slugifyTag(tag)));
  return getPosts()
    .filter((entry) => !excluded.has(entry.slug))
    .map((entry) => {
      const shared = entry.tags.reduce((count, tag) => count + (tags.has(slugifyTag(tag)) ? 1 : 0), 0);
      const sameCategory = entry.category === post.category ? 1 : 0;
      return { entry, score: shared * 2 + sameCategory };
    })
    .filter((item) => item.score > 0)
    .sort(
      (a, b) => b.score - a.score || b.entry.date.localeCompare(a.entry.date) || a.entry.slug.localeCompare(b.entry.slug)
    )
    .slice(0, limit)
    .map((item) => item.entry);
}

export function getPostAuthor(post: Post, config: OpenBlogConfig = getOpenBlogConfig()): AuthorCredit {
  if (post.author) return { name: post.author };
  return {
    name: config.author.name,
    url: config.author.url || undefined,
    avatar: config.author.avatar || undefined
  };
}

export function languageLabel(code: string): string {
  const normalized = code.trim().toLowerCase();
  return LANGUAGE_NAMES[normalized] ?? LANGUAGE_NAMES[normalized.split('-')[0] ?? ''] ?? code;
}

export function formatPostDate(date: string): string {
  return date;
}

export function formatReadingTime(minutes: number): string {
  return minutes === 1 ? '1 min read' : `${minutes} min read`;
}

export function newestStamp(posts: Post[] = getPosts()): string {
  return posts.reduce((latest, post) => {
    const stamp = post.updated ?? post.date;
    return stamp > latest ? stamp : latest;
  }, '');
}

export function getPostPath(slug: string): string {
  return `/posts/${slug
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')}`;
}
