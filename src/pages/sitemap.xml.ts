import type { APIRoute } from 'astro';
import { getPagePath, getPages } from '../lib/pages';
import {
  getCategoryPath,
  getPostPath,
  getPosts,
  getSeriesList,
  getSeriesPath,
  getSeriesPosts,
  getTagPathBySlug,
  getTagRecords,
  newestStamp,
  slugifyTag
} from '../lib/posts';
import { getSiteUrl } from '../lib/site';
import { escapeXml, toAbsoluteUrl } from '../lib/seo';
import { withBase } from '../lib/paths';

const later = (current: string, next: string) => (next > current ? next : current);

export const GET: APIRoute = ({ site }) => {
  const posts = getPosts().filter((post) => !post.noindex);
  const siteUrl = getSiteUrl(site);
  const siteNewest = newestStamp(posts);
  const entries: { path: string; lastmod?: string }[] = [
    { path: '/', lastmod: siteNewest },
    { path: '/about' },
    { path: '/archive', lastmod: siteNewest },
    { path: '/search', lastmod: siteNewest },
    { path: '/series', lastmod: siteNewest }
  ];

  for (const page of getPages()) {
    entries.push({ path: getPagePath(page.slug), lastmod: page.updated });
  }

  for (const post of posts) {
    entries.push({ path: getPostPath(post.slug), lastmod: post.updated ?? post.date });
  }

  const categories = new Map<string, string>();
  for (const post of posts) {
    const stamp = post.updated ?? post.date;
    categories.set(post.category, later(categories.get(post.category) ?? '', stamp));
  }
  for (const [category, lastmod] of categories) {
    entries.push({ path: getCategoryPath(category), lastmod });
  }

  for (const tag of getTagRecords()) {
    const tagged = posts.filter((post) => post.tags.some((name) => slugifyTag(name) === tag.slug));
    entries.push({ path: getTagPathBySlug(tag.slug), lastmod: newestStamp(tagged) });
  }

  for (const series of getSeriesList()) {
    entries.push({ path: getSeriesPath(series.slug), lastmod: newestStamp(getSeriesPosts(series.slug)) });
  }

  const urls = entries
    .map((entry) => {
      const loc = `<loc>${escapeXml(toAbsoluteUrl(withBase(entry.path), siteUrl))}</loc>`;
      const lastmod = entry.lastmod ? `<lastmod>${escapeXml(entry.lastmod)}</lastmod>` : '';
      return `<url>${loc}${lastmod}</url>`;
    })
    .join('');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } }
  );
};
