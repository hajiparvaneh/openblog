import type { APIRoute } from 'astro';
import { toAbsoluteUrl } from '../lib/seo';
import { getSiteUrl } from '../lib/site';

export const GET: APIRoute = ({ site }) => {
  const baseUrl = getSiteUrl(site);
  const sitemapUrl = toAbsoluteUrl('/sitemap.xml', baseUrl);

  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemapUrl}\n`, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8'
    }
  });
};
