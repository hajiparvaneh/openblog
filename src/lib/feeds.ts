import { getPostAuthor, getPostPath, getPosts, type Post } from './posts';
import { renderMarkdown } from './markdown';
import { getOpenBlogConfig } from './site';
import { absolutizeHtml, escapeXml, toAbsoluteUrl } from './seo';
import { withBase } from './paths';

export type FeedContext = {
  site: URL;
};

function postLink(post: Post, site: URL): string {
  return toAbsoluteUrl(withBase(getPostPath(post.slug)), site);
}

function latestStamp(posts: Post[]): string {
  return posts.reduce((latest, post) => {
    const stamp = post.updated ?? post.date;
    return stamp > latest ? stamp : latest;
  }, posts[0]?.date ?? '1970-01-01');
}

function rfc822(date: string): string {
  return new Date(`${date}T00:00:00Z`).toUTCString();
}

function iso(date: string): string {
  return `${date}T00:00:00Z`;
}

async function feedPosts(site: URL): Promise<Array<{ post: Post; html: string; url: string }>> {
  const posts = getPosts().filter((post) => !post.noindex);
  const rendered = [];
  for (const post of posts) {
    const { html } = await renderMarkdown(post.body);
    rendered.push({
      post,
      html: absolutizeHtml(html, site),
      url: postLink(post, site)
    });
  }
  return rendered;
}

export async function renderRss({ site }: FeedContext): Promise<string> {
  const config = getOpenBlogConfig();
  const home = toAbsoluteUrl(withBase('/'), site);
  const self = toAbsoluteUrl(withBase('/rss.xml'), site);
  const items = await feedPosts(site);
  const author = config.author.name;
  const body = items
    .map(({ post, html, url }) => {
      const byline = getPostAuthor(post, config).name;
      const categories = post.tags.map((tag) => `<category>${escapeXml(tag)}</category>`).join('');
      return `<item><title>${escapeXml(post.title)}</title><link>${escapeXml(url)}</link><guid isPermaLink="true">${escapeXml(url)}</guid><pubDate>${escapeXml(rfc822(post.date))}</pubDate><dc:creator>${escapeXml(byline)}</dc:creator><description>${escapeXml(post.description)}</description><content:encoded>${escapeXml(html)}</content:encoded>${categories}</item>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/"><channel><title>${escapeXml(config.title)}</title><link>${escapeXml(home)}</link><description>${escapeXml(config.description)}</description><language>en</language><lastBuildDate>${escapeXml(rfc822(latestStamp(items.map((item) => item.post))))}</lastBuildDate><atom:link href="${escapeXml(self)}" rel="self" type="application/rss+xml"/><generator>OpenBlog</generator><dc:creator>${escapeXml(author)}</dc:creator>${body}</channel></rss>`;
}

export async function renderAtom({ site }: FeedContext): Promise<string> {
  const config = getOpenBlogConfig();
  const home = toAbsoluteUrl(withBase('/'), site);
  const self = toAbsoluteUrl(withBase('/atom.xml'), site);
  const items = await feedPosts(site);
  const updated = iso(latestStamp(items.map((item) => item.post)));
  const entries = items
    .map(({ post, html, url }) => {
      const byline = getPostAuthor(post, config);
      const categories = post.tags.map((tag) => `<category term="${escapeXml(tag)}"/>`).join('');
      const authorUri = byline.url ? `<uri>${escapeXml(byline.url)}</uri>` : '';
      return `<entry><title>${escapeXml(post.title)}</title><link href="${escapeXml(url)}" rel="alternate"/><id>${escapeXml(url)}</id><published>${escapeXml(iso(post.date))}</published><updated>${escapeXml(iso(post.updated ?? post.date))}</updated><author><name>${escapeXml(byline.name)}</name>${authorUri}</author><summary>${escapeXml(post.description)}</summary><content type="html">${escapeXml(html)}</content>${categories}</entry>`;
    })
    .join('');
  const feedAuthorUri = config.author.url ? `<uri>${escapeXml(config.author.url)}</uri>` : '';

  return `<?xml version="1.0" encoding="UTF-8"?><feed xmlns="http://www.w3.org/2005/Atom"><title>${escapeXml(config.title)}</title><subtitle>${escapeXml(config.description)}</subtitle><link href="${escapeXml(home)}" rel="alternate"/><link href="${escapeXml(self)}" rel="self"/><id>${escapeXml(home)}</id><updated>${escapeXml(updated)}</updated><author><name>${escapeXml(config.author.name)}</name>${feedAuthorUri}</author><generator>OpenBlog</generator>${entries}</feed>`;
}

export async function renderJsonFeed({ site }: FeedContext): Promise<string> {
  const config = getOpenBlogConfig();
  const home = toAbsoluteUrl(withBase('/'), site);
  const self = toAbsoluteUrl(withBase('/feed.json'), site);
  const items = await feedPosts(site);
  const avatar = config.author.avatar
    ? toAbsoluteUrl(config.author.avatar.startsWith('http') ? config.author.avatar : withBase(config.author.avatar), site)
    : undefined;
  const author = {
    name: config.author.name,
    ...(config.author.url ? { url: config.author.url } : {}),
    ...(avatar ? { avatar } : {})
  };

  return JSON.stringify(
    {
      version: 'https://jsonfeed.org/version/1.1',
      title: config.title,
      home_page_url: home,
      feed_url: self,
      description: config.description,
      language: 'en',
      authors: [author],
      items: items.map(({ post, html, url }) => {
        const byline = getPostAuthor(post, config);
        return {
          id: url,
          url,
          title: post.title,
          summary: post.description,
          content_html: html,
          date_published: iso(post.date),
          date_modified: iso(post.updated ?? post.date),
          tags: post.tags,
          language: post.lang,
          authors: [
            {
              name: byline.name,
              ...(byline.url ? { url: byline.url } : {})
            }
          ]
        };
      })
    },
    null,
    2
  );
}
