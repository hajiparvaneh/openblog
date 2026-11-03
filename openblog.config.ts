/**
 * OpenBlog site branding and navigation.
 * Change this file (and assets under public/branding/) — you should not need to edit layouts.
 */
export type OpenBlogNavItem = {
  label: string;
  href: string;
};

export type OpenBlogConfig = {
  title: string;
  description: string;
  /**
   * Public site origin only (no repo subpath), e.g. `https://you.github.io/` or `https://blog.example.com/`.
   * Pair with `basePath` for GitHub project Pages. Do not put `/repo` in both places.
   */
  siteUrl: string;
  /**
   * Astro `base` path for GitHub project Pages (e.g. `/my-blog`).
   * Use `/` for a custom domain or user/org root site.
   */
  basePath: string;
  logo: {
    light: string;
    dark: string;
  };
  favicon: string;
  appleTouchIcon: string;
  ogImage: string;
  accentColor: string;
  defaultTheme: 'light' | 'dark';
  nav: OpenBlogNavItem[];
  /** Markdown file rendered on /about */
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
  description:
    'A Markdown blog you can brand, write, and publish from GitHub — no credentials required to build.',
  siteUrl: normalizeSiteUrl(env('OPENBLOG_BASE_URL') ?? env('SITE_URL') ?? 'https://openblog.cc/'),
  basePath: normalizeBasePath(env('OPENBLOG_BASE_PATH') ?? '/'),
  logo: {
    light: '/branding/logo-light.png',
    dark: '/branding/logo-dark.png'
  },
  favicon: '/branding/favicon.ico',
  appleTouchIcon: '/branding/apple-touch-icon.png',
  ogImage: '/branding/og-default.png',
  accentColor: '#0969da',
  defaultTheme: 'light',
  nav: [
    { label: 'Blog', href: '/' },
    { label: 'About', href: '/about' }
  ],
  aboutMarkdownPath: 'content/about.md',
  footerText: 'Published with OpenBlog',
  repositoryUrl: 'https://github.com/hajiparvaneh/openblog'
};

export default config;
