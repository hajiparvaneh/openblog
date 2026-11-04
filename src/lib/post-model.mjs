const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SLUG_SEGMENT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LANG_RE = /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i;
const TRANSLATION_FILE = /^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/;

export const RESERVED_PAGE_SLUGS = [
  'about',
  'archive',
  'search',
  'posts',
  'categories',
  'tag',
  'page',
  'series',
  'index'
];

export function humanize(value) {
  return String(value)
    .split(/[-_/]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function slugify(value) {
  return String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export function isValidDate(value) {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function optionalString(value) {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function dateInput(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  if (typeof value === 'string' && value.trim()) return value.trim().slice(0, 10);
  return '';
}

export function normalizeDate(value) {
  const input = dateInput(value);
  if (isValidDate(input)) return input;
  if (typeof value === 'string' && value.trim()) {
    const parsed = new Date(value.trim());
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
    return value.trim();
  }
  return '1970-01-01';
}

function normalizeTags(raw) {
  if (Array.isArray(raw)) return raw.map((tag) => String(tag).trim()).filter(Boolean);
  if (typeof raw === 'string') {
    return raw
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return [];
}

export function readingMinutesFromBody(body) {
  const words = String(body ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  if (words === 0) return 1;
  return Math.max(1, Math.round(words / 200));
}

function seriesOrderValue(data) {
  const raw = data.seriesOrder ?? data.order;
  if (raw == null || raw === '') return undefined;
  const value = typeof raw === 'number' ? raw : Number(String(raw).trim());
  return Number.isFinite(value) ? value : undefined;
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function normalizePost(slug, data, body) {
  const source = data && typeof data === 'object' ? data : {};
  const category = String(slug).split('/')[0] || 'posts';
  const fileName = String(slug).split('/').pop() || slug;
  const series = optionalString(source.series);
  const updated = dateInput(source.updated);

  return {
    slug: String(slug),
    category,
    categoryLabel: humanize(category),
    title: optionalString(source.title) || humanize(fileName),
    description: optionalString(source.description) || '',
    date: normalizeDate(source.date),
    updated: isValidDate(updated) ? updated : undefined,
    thumbnail: optionalString(source.thumbnail),
    thumbnailAlt: optionalString(source.thumbnailAlt),
    tags: normalizeTags(source.tags),
    draft: Boolean(source.draft),
    featured: Boolean(source.featured),
    lang: (optionalString(source.lang) || 'en').toLowerCase(),
    author: optionalString(source.author),
    series,
    seriesSlug: series ? slugify(series) : undefined,
    seriesOrder: seriesOrderValue(source),
    translateOfFile: optionalString(source.translateOf),
    canonical: optionalString(source.canonical),
    noindex: Boolean(source.noindex),
    discussionUrl: optionalString(source.discussionUrl),
    readingMinutes: readingMinutesFromBody(body),
    body: String(body ?? '').trim()
  };
}

export function normalizePage(slug, data, body) {
  const source = data && typeof data === 'object' ? data : {};
  const updated = dateInput(source.updated);
  return {
    slug: String(slug),
    title: optionalString(source.title) || humanize(slug),
    description: optionalString(source.description) || '',
    updated: isValidDate(updated) ? updated : undefined,
    body: String(body ?? '').trim()
  };
}

function labelFor(entry) {
  return entry.filePath || entry.slug;
}

export function validatePostEntries(entries) {
  const errors = [];
  const seen = new Map();
  const seriesOrders = new Map();

  for (const entry of entries) {
    const data = entry.data && typeof entry.data === 'object' ? entry.data : {};
    const label = labelFor(entry);
    const parts = String(entry.slug || '').split('/');
    if (parts.length !== 2 || parts.some((part) => !SLUG_SEGMENT.test(part))) {
      errors.push(`${label}: use content/posts/<category>/<post-name>.md with lowercase words and hyphens.`);
    }

    const key = String(entry.slug || '').toLowerCase();
    if (key && seen.has(key)) errors.push(`${label}: duplicate slug "${entry.slug}" (also ${seen.get(key)}).`);
    else if (key) seen.set(key, label);

    if (!optionalString(data.title)) errors.push(`${label}: missing title.`);

    const date = dateInput(data.date);
    if (!isValidDate(date)) errors.push(`${label}: date must be YYYY-MM-DD.`);

    if (data.updated != null && data.updated !== '') {
      const updated = dateInput(data.updated);
      if (!isValidDate(updated)) errors.push(`${label}: updated must be YYYY-MM-DD.`);
    }

    if (data.lang != null && data.lang !== '' && !LANG_RE.test(String(data.lang).trim())) {
      errors.push(`${label}: lang must be a language code such as en, fr, or es.`);
    }

    if (data.author != null && data.author !== '' && typeof data.author !== 'string') {
      errors.push(`${label}: author must be a string.`);
    }

    const series = optionalString(data.series);
    const rawOrder = data.seriesOrder ?? data.order;
    if (rawOrder != null && rawOrder !== '' && !series) errors.push(`${label}: seriesOrder requires series.`);
    if (rawOrder != null && rawOrder !== '' && !Number.isFinite(Number(rawOrder))) {
      errors.push(`${label}: seriesOrder must be a number.`);
    }
    if (series && !slugify(series)) errors.push(`${label}: series needs a name that can become a URL slug.`);
    if (series && rawOrder != null && rawOrder !== '' && Number.isFinite(Number(rawOrder))) {
      const orderKey = `${slugify(series)}:${Number(rawOrder)}`;
      if (seriesOrders.has(orderKey)) {
        errors.push(`${label}: duplicate seriesOrder ${Number(rawOrder)} in "${series}" (also ${seriesOrders.get(orderKey)}).`);
      } else {
        seriesOrders.set(orderKey, label);
      }
    }

    const canonical = optionalString(data.canonical);
    if (canonical && !isHttpUrl(canonical)) errors.push(`${label}: canonical must be an absolute http(s) URL.`);

    const discussionUrl = optionalString(data.discussionUrl);
    if (discussionUrl && !isHttpUrl(discussionUrl)) errors.push(`${label}: discussionUrl must be an absolute http(s) URL.`);

    if (data.noindex != null && typeof data.noindex !== 'boolean') {
      errors.push(`${label}: noindex must be true or false.`);
    }

    const translateOf = optionalString(data.translateOf);
    if (translateOf) {
      if (!TRANSLATION_FILE.test(translateOf)) {
        errors.push(`${label}: translateOf must be a Markdown file name in the same category folder.`);
      } else {
        const category = parts[0] || '';
        const target = `${category}/${translateOf.replace(/\.md$/i, '')}`;
        if (target === entry.slug) errors.push(`${label}: translateOf cannot point at the same file.`);
        else {
          const targetEntry = entries.find((candidate) => candidate.slug === target);
          if (!targetEntry) errors.push(`${label}: translateOf "${translateOf}" does not exist in the same category.`);
          else if (targetEntry.data?.draft === true) errors.push(`${label}: translateOf target is a draft.`);
          else {
            const targetLang = String(targetEntry.data?.lang ?? 'en').trim().toLowerCase();
            const lang = String(data.lang ?? 'en').trim().toLowerCase();
            if (lang === targetLang) errors.push(`${label}: a translation needs a different lang than its source.`);
          }
        }
      }
    }
  }

  return errors;
}

export function validateContentPages(entries) {
  const errors = [];
  const seen = new Map();
  const reserved = new Set(RESERVED_PAGE_SLUGS);

  for (const entry of entries) {
    const data = entry.data && typeof entry.data === 'object' ? entry.data : {};
    const label = labelFor(entry);
    const slug = String(entry.slug || '');
    if (!SLUG_SEGMENT.test(slug)) errors.push(`${label}: page file name must use lowercase words and hyphens.`);
    if (reserved.has(slug)) errors.push(`${label}: "${slug}" is reserved by a built-in route.`);
    if (seen.has(slug)) errors.push(`${label}: duplicate page slug "${slug}" (also ${seen.get(slug)}).`);
    else seen.set(slug, label);
    if (!optionalString(data.title)) errors.push(`${label}: missing title.`);
    if (data.updated != null && data.updated !== '' && !isValidDate(dateInput(data.updated))) {
      errors.push(`${label}: updated must be YYYY-MM-DD.`);
    }
  }

  return errors;
}
