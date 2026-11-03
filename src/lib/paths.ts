export function withBase(path: string): string {
  const base = typeof import.meta.env?.BASE_URL === 'string' ? import.meta.env.BASE_URL : '/';
  const normalizedBase = base === '/' ? '' : base.replace(/\/+$/, '');
  if (!path || path === '/') return normalizedBase ? `${normalizedBase}/` : '/';
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}
