import path from 'node:path';
import matter from 'gray-matter';
import { normalizePage, RESERVED_PAGE_SLUGS, type NormalizedPage } from './post-model.mjs';

export type SitePage = NormalizedPage;

const reserved = new Set(RESERVED_PAGE_SLUGS);

const pageFiles = import.meta.glob('../../content/pages/*.md', {
  eager: true,
  query: '?raw',
  import: 'default'
}) as Record<string, string>;

function slugFromGlobKey(key: string): string {
  const normalized = key.replace(/\\/g, '/');
  return path.basename(normalized).replace(/\.md$/i, '');
}

let cachedPages: SitePage[] | null = null;

export function getPages(): SitePage[] {
  if (import.meta.env.PROD && cachedPages) return cachedPages;
  const pages = Object.entries(pageFiles)
    .map(([filePath, raw]) => {
      const parsed = matter(raw);
      return normalizePage(slugFromGlobKey(filePath), parsed.data, parsed.content);
    })
    .filter((page) => page.slug && !reserved.has(page.slug) && !page.slug.includes('/'))
    .sort((a, b) => a.title.localeCompare(b.title));
  if (import.meta.env.PROD) cachedPages = pages;
  return pages;
}

export function getPageBySlug(slug: string): SitePage | undefined {
  return getPages().find((page) => page.slug === slug);
}

export function getPagePath(slug: string): string {
  return `/${encodeURIComponent(slug)}`;
}
