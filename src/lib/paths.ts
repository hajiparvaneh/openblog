/**
 * Prefix an absolute app path with Astro's configured base (e.g. `/my-blog`).
 * Pass paths that already start with `/`.
 */
export function withBase(path: string): string {
  const base = typeof import.meta.env?.BASE_URL === 'string' ? import.meta.env.BASE_URL : '/';
  const normalizedBase = base === '/' ? '' : base.replace(/\/+$/, '');
  if (!path || path === '/') {
    return normalizedBase ? `${normalizedBase}/` : '/';
  }
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}
