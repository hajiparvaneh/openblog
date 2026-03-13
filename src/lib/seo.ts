const ABSOLUTE_URL_PATTERN = /^[a-z][a-z\d+\-.]*:\/\//i;

export function toAbsoluteUrl(pathOrUrl: string, site: URL): string {
  if (ABSOLUTE_URL_PATTERN.test(pathOrUrl)) {
    return pathOrUrl;
  }

  const normalized = pathOrUrl.replace(/^\/+/, '');
  return new URL(normalized, site).toString();
}
