/**
 * Brand your blog here — you should not need to edit layouts for a normal site.
 */
export type OpenBlogNavItem = { label: string; href: string };

export type OpenBlogConfig = {
  title: string;
  description: string;
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
  description: 'A free Markdown blog. Clone, brand, write, and publish — no secrets required.',
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
    { label: 'Blog', href: '/' },
    { label: 'About', href: '/about' }
  ],
  aboutMarkdownPath: 'content/about.md',
  footerText: 'Published with OpenBlog',
  repositoryUrl: 'https://github.com/hajiparvaneh/openblog'
};

export default config;
