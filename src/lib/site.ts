import openblogConfig from '../../openblog.config';

export type { OpenBlogConfig } from '../../openblog.config';

function ensureTrailingSlash(url: string): string {
  return url.endsWith('/') ? url : `${url}/`;
}

export function getOpenBlogConfig() {
  return openblogConfig;
}

export function getSiteUrl(site?: URL | string | null): URL {
  if (site instanceof URL) return site;
  if (typeof site === 'string' && site.trim()) {
    return new URL(ensureTrailingSlash(site.trim()));
  }
  const fromEnv = process.env.OPENBLOG_BASE_URL ?? process.env.SITE_URL ?? openblogConfig.siteUrl;
  try {
    return new URL(ensureTrailingSlash(fromEnv.trim()));
  } catch {
    return new URL(openblogConfig.siteUrl);
  }
}
