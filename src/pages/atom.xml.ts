import type { APIRoute } from 'astro';
import { renderAtom } from '../lib/feeds';
import { getSiteUrl } from '../lib/site';

export const GET: APIRoute = async ({ site }) =>
  new Response(await renderAtom({ site: getSiteUrl(site) }), {
    headers: { 'Content-Type': 'application/atom+xml; charset=utf-8' }
  });
