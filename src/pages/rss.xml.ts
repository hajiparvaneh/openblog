import type { APIRoute } from 'astro';
import { renderRss } from '../lib/feeds';
import { getSiteUrl } from '../lib/site';

export const GET: APIRoute = async ({ site }) =>
  new Response(await renderRss({ site: getSiteUrl(site) }), {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' }
  });
