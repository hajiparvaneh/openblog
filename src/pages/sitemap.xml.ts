import type { APIRoute } from 'astro';
import { getCategoryPath, getKnownContributors, getPosts, getProfilePath } from '../lib/openblog';
import { toAbsoluteUrl } from '../lib/seo';

type SitemapEntry = {
  path: string;
  lastmod?: string;
  changefreq?: 'daily' | 'weekly' | 'monthly';
  priority?: number;
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function postPath(slug: string): string {
  return `/posts/${slug
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')}`;
}

export const GET: APIRoute = ({ site }) => {
  const baseUrl = site ?? new URL('https://hajiparvaneh.github.io/');
  const posts = getPosts();
  const staticEntries: SitemapEntry[] = [
    { path: '/', changefreq: 'daily', priority: 1 },
    { path: '/leaderboard', changefreq: 'daily', priority: 0.8 },
    { path: '/how-to-contribute', changefreq: 'weekly', priority: 0.7 }
  ];

  const categoryEntries: SitemapEntry[] = [...new Set(posts.map((post) => getCategoryPath(post.category)))].map((path) => ({
    path,
    changefreq: 'weekly',
    priority: 0.7
  }));

  const postEntries: SitemapEntry[] = posts.map((post) => ({
    path: postPath(post.slug),
    lastmod: post.date || undefined,
    changefreq: 'monthly',
    priority: 0.9
  }));

  const profileEntries: SitemapEntry[] = getKnownContributors().map((username) => ({
    path: getProfilePath(username),
    changefreq: 'weekly',
    priority: 0.6
  }));

  const mergedByPath = new Map<string, SitemapEntry>();
  for (const entry of [...staticEntries, ...categoryEntries, ...postEntries, ...profileEntries]) {
    const existing = mergedByPath.get(entry.path);
    if (!existing) {
      mergedByPath.set(entry.path, entry);
      continue;
    }

    if (entry.lastmod && (!existing.lastmod || entry.lastmod > existing.lastmod)) {
      existing.lastmod = entry.lastmod;
    }
    if (entry.priority && (!existing.priority || entry.priority > existing.priority)) {
      existing.priority = entry.priority;
    }
    if (!existing.changefreq && entry.changefreq) {
      existing.changefreq = entry.changefreq;
    }
  }

  const urls = [...mergedByPath.values()]
    .sort((a, b) => a.path.localeCompare(b.path))
    .map((entry) => {
      const absolute = toAbsoluteUrl(entry.path, baseUrl);
      const lines = [`<loc>${escapeXml(absolute)}</loc>`];

      if (entry.lastmod) {
        lines.push(`<lastmod>${escapeXml(entry.lastmod)}</lastmod>`);
      }
      if (entry.changefreq) {
        lines.push(`<changefreq>${entry.changefreq}</changefreq>`);
      }
      if (typeof entry.priority === 'number') {
        lines.push(`<priority>${entry.priority.toFixed(1)}</priority>`);
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
