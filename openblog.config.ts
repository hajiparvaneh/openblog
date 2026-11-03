/**
 * Brand your blog here — you should not need to edit layouts for a normal site.
 */
export type OpenBlogNavItem = { label: string; href: string };

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
  nav: OpenBlogNavItem[];
  aboutMarkdownPath: string;
  footerText: string;
  repositoryUrl: string;
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
  tagline: 'A Markdown blog ready to publish',
  description:
    'A free Git-based technical blog with sample posts, categories, and tags. Brand it, write in Markdown, and publish with GitHub Pages — no secrets required.',
  heroHeadline: 'Your technical blog starts here.',
  heroSupporting:
    'This site already has posts, categories, and tags. Replace the samples with your writing, brand the header, and publish from Git.',
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
  nav: [
    { label: 'Home', href: '/' },
    { label: 'How to contribute', href: '/how-to-contribute' },
    { label: 'About', href: '/about' }
  ],
  aboutMarkdownPath: 'content/about.md',
  footerText: 'Published with OpenBlog. Write a post, open a PR, and ship.',
  repositoryUrl: 'https://github.com/hajiparvaneh/openblog'
};

export default config;
