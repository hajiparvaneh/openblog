const DEFAULT_SITE_URL = 'https://openblog.cc/';

function ensureTrailingSlash(url: string): string {
  return url.endsWith('/') ? url : `${url}/`;
}

export function getSiteUrl(site?: URL | string | null): URL {
  if (site instanceof URL) {
    return site;
  }

  if (typeof site === 'string' && site.trim()) {
    return new URL(ensureTrailingSlash(site.trim()));
  }

  const fromEnv = process.env.OPENBLOG_BASE_URL ?? process.env.SITE_URL ?? DEFAULT_SITE_URL;
  try {
    return new URL(ensureTrailingSlash(fromEnv.trim()));
  } catch {
    return new URL(DEFAULT_SITE_URL);
  }
}
