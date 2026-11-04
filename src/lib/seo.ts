const ABSOLUTE_URL_PATTERN = /^[a-z][a-z\d+\-.]*:\/\//i;

export function toAbsoluteUrl(pathOrUrl: string, site: URL): string {
  if (ABSOLUTE_URL_PATTERN.test(pathOrUrl)) return pathOrUrl;
  const normalized = pathOrUrl.replace(/^\/+/, '');
  return new URL(normalized, site).toString();
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function absolutizeHtml(html: string, site: URL): string {
  return html.replace(/(\s(?:href|src)=["'])(\/(?!\/)[^"']*)/g, (_match, attr: string, path: string) => {
    return `${attr}${toAbsoluteUrl(path, site)}`;
  });
}
