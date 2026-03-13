import type { APIRoute } from 'astro';
import { toAbsoluteUrl } from '../lib/seo';

export const GET: APIRoute = ({ site }) => {
  const baseUrl = site ?? new URL('https://hajiparvaneh.github.io/');
  const sitemapUrl = toAbsoluteUrl('/sitemap.xml', baseUrl);

  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemapUrl}\n`, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8'
    }
  });
};
