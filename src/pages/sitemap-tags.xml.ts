import type { APIRoute } from 'astro';
import { getPosts, getTagPath, getTagRecords, slugifyTag } from '../lib/openblog';
import { toAbsoluteUrl } from '../lib/seo';
import { getSiteUrl } from '../lib/site';

type TagSitemapEntry = {
  path: string;
  lastmod?: string;
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const GET: APIRoute = ({ site }) => {
  const baseUrl = getSiteUrl(site);
  const posts = getPosts();

  const entries: TagSitemapEntry[] = getTagRecords().map((tag) => {
    const latestTaggedPost = posts.find((post) =>
      post.tags.some((postTag) => slugifyTag(postTag) === tag.slug)
    );

    return {
      path: getTagPath(tag.label),
      lastmod: latestTaggedPost?.date || undefined
    };
  });

  const urls = entries
    .sort((a, b) => a.path.localeCompare(b.path))
    .map((entry) => {
      const absolute = toAbsoluteUrl(entry.path, baseUrl);
      const lines = [`<loc>${escapeXml(absolute)}</loc>`, '<changefreq>weekly</changefreq>', '<priority>0.6</priority>'];

      if (entry.lastmod) {
        lines.splice(1, 0, `<lastmod>${escapeXml(entry.lastmod)}</lastmod>`);
      }

      return `  <url>\n    ${lines.join('\n    ')}\n  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8'
    }
  });
};
