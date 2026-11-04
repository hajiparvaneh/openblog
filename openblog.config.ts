/**
 * Brand your blog here — you should not need to edit layouts for a normal site.
 */
export type OpenBlogNavItem = { label: string; href: string };

export type OpenBlogAuthor = {
  name: string;
  url: string;
  avatar: string;
};

export type OpenBlogLicense = {
  name: string;
  url: string;
};

export type OpenBlogConfig = {
  title: string;
  tagline: string;
  description: string;
  heroHeadline: string;
  heroSupporting: string;
  /** Origin only, e.g. https://you.github.io/ — pair with basePath for project Pages */
  siteUrl: string;
  /** `/` for custom domain / root; `/repo-name` for GitHub project Pages */
  basePath: string;
  logo: { light: string; dark: string };
  favicon: string;
  appleTouchIcon: string;
  ogImage: string;
  accentColor: string;
  defaultTheme: 'light' | 'dark';
  /** Default byline when a post does not set `author` */
  author: OpenBlogAuthor;
  nav: OpenBlogNavItem[];
  aboutMarkdownPath: string;
  /** Extra pages linked from the footer. Point these at files in `content/pages/` */
  footerLinks: OpenBlogNavItem[];
  footerText: string;
  /** Shown as a “Source” link in the footer; set empty to hide */
  repositoryUrl: string;
  /** Mastodon profile URL; set empty to hide */
  mastodonUrl: string;
  /** License for post content. The code stays MIT. Set name empty to hide. */
  contentLicense: OpenBlogLicense;
};

function env(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : undefined;
}

function normalizeBasePath(value: string): string {
  const trimmed = value.trim() || '/';
  if (trimmed === '/') return '/';
  const withLeading = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withLeading.replace(/\/+$/, '');
}

function normalizeSiteUrl(value: string): string {
  return value.endsWith('/') ? value : `${value}/`;
}

const config: OpenBlogConfig = {
  title: 'OpenBlog',
  tagline: 'A free open-source Markdown blog',
  description:
    'OpenBlog is a free, open-source, file-based blog. Write posts as Markdown on GitHub, publish a static site, and share it with readers under the MIT license.',
  heroHeadline: 'A free blog built from Markdown files on GitHub.',
  heroSupporting:
    'Open source, MIT licensed, and file-based — no CMS lock-in. Read the starter posts to see how OpenBlog works, then make the archive your own.',
  siteUrl: normalizeSiteUrl(env('OPENBLOG_BASE_URL') ?? env('SITE_URL') ?? 'https://example.com/'),
  basePath: normalizeBasePath(env('OPENBLOG_BASE_PATH') ?? '/'),
  logo: {
    light: '/openblog-logo-light.png',
    dark: '/openblog-logo-dark.png'
  },
  favicon: '/favicon.ico',
  appleTouchIcon: '/apple-touch-icon.png',
  ogImage: '/og-default.png',
  accentColor: '#0969da',
  defaultTheme: 'light',
  author: {
    name: 'OpenBlog',
    url: 'https://github.com/hajiparvaneh/openblog',
    avatar: '/openblog-logo-light.png'
  },
  nav: [
    { label: 'Home', href: '/' },
    { label: 'Archive', href: '/archive' },
    { label: 'Search', href: '/search' },
    { label: 'About', href: '/about' }
  ],
  aboutMarkdownPath: 'content/about.md',
  footerLinks: [
    { label: 'Now', href: '/now' },
    { label: 'Colophon', href: '/colophon' },
    { label: 'Uses', href: '/uses' }
  ],
  footerText: 'Thanks for reading. Explore more posts by category, tag, or year.',
  repositoryUrl: 'https://github.com/hajiparvaneh/openblog',
  mastodonUrl: '',
  contentLicense: {
    name: 'CC BY 4.0',
    url: 'https://creativecommons.org/licenses/by/4.0/'
  }
};

export default config;
