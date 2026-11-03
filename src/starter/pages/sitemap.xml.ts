import type { APIRoute } from 'astro';
import { getCategoryPath, getPosts, getTagPathBySlug, getTagRecords } from '../../lib/openblog';
import { getSiteUrl } from '../../lib/site';
import { toAbsoluteUrl } from '../../lib/seo';
const escapeXml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
export const GET: APIRoute = ({ site }) => {
  const posts = getPosts();
  const paths = new Set(['/', ...posts.map(post => `/posts/${post.slug.split('/').map(encodeURIComponent).join('/')}`),
    ...posts.map(post => getCategoryPath(post.category)), ...getTagRecords().map(tag => getTagPathBySlug(tag.slug))]);
  const urls = [...paths].map(path => `<url><loc>${escapeXml(toAbsoluteUrl(path, getSiteUrl(site)))}</loc></url>`).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
