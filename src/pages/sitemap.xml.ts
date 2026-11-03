import type { APIRoute } from 'astro';
import { getCategoryPath, getPostPath, getPosts, getTagPathBySlug, getTagRecords } from '../lib/posts';
import { getSiteUrl } from '../lib/site';
import { toAbsoluteUrl } from '../lib/seo';
import { withBase } from '../lib/paths';

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export const GET: APIRoute = ({ site }) => {
  const posts = getPosts();
  const paths = new Set([
    '/',
    '/about',
    ...posts.map((post) => getPostPath(post.slug)),
    ...posts.map((post) => getCategoryPath(post.category)),
    ...getTagRecords().map((tag) => getTagPathBySlug(tag.slug))
  ]);
  const siteUrl = getSiteUrl(site);
  const urls = [...paths]
    .map((path) => `<url><loc>${escapeXml(toAbsoluteUrl(withBase(path), siteUrl))}</loc></url>`)
    .join('');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } }
  );
};
