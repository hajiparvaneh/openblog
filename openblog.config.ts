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
  tagline: 'Markdown blogging for developers',
  description:
    'A free Git-based Markdown blog. Write posts as pull requests, brand your site from config, and publish with no secrets.',
  heroHeadline: 'Write in public and grow with every pull request.',
  heroSupporting:
    'Publish technical posts from Markdown in Git. Improve writing through reviews, keep a clean archive, and share a site that looks ready for readers.',
  siteUrl: normalizeSiteUrl(env('OPENBLOG_BASE_URL') ?? env('SITE_URL') ?? 'https://example.com/'),
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
    { label: 'Home', href: '/' },
    { label: 'How to contribute', href: '/how-to-contribute' },
    { label: 'About', href: '/about' }
  ],
  aboutMarkdownPath: 'content/about.md',
  footerText: 'Built with OpenBlog. Write a post, open a PR, and publish.',
  repositoryUrl: 'https://github.com/hajiparvaneh/openblog'
};

export default config;
