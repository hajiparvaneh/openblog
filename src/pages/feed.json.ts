import type { APIRoute } from 'astro';
import { renderJsonFeed } from '../lib/feeds';
import { getSiteUrl } from '../lib/site';

export const GET: APIRoute = async ({ site }) =>
  new Response(await renderJsonFeed({ site: getSiteUrl(site) }), {
    headers: { 'Content-Type': 'application/feed+json; charset=utf-8' }
  });
