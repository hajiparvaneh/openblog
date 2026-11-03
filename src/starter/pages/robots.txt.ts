import type { APIRoute } from 'astro';
import { getSiteUrl } from '../../lib/site';
import { toAbsoluteUrl } from '../../lib/seo';
export const GET: APIRoute = ({ site }) => new Response(`User-agent: *\nAllow: /\n\nSitemap: ${toAbsoluteUrl('/sitemap.xml', getSiteUrl(site))}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
