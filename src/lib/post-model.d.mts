export type PostData = Record<string, unknown>;

export type NormalizedPost = {
  slug: string;
  category: string;
  categoryLabel: string;
  title: string;
  description: string;
  date: string;
  updated?: string;
  thumbnail?: string;
  thumbnailAlt?: string;
  tags: string[];
  draft: boolean;
  featured: boolean;
  lang: string;
  author?: string;
  series?: string;
  seriesSlug?: string;
  seriesOrder?: number;
  translateOfFile?: string;
  canonical?: string;
  noindex: boolean;
  discussionUrl?: string;
  readingMinutes: number;
  body: string;
};

export type NormalizedPage = {
  slug: string;
  title: string;
  description: string;
  updated?: string;
  body: string;
};

export type ContentEntry = {
  slug: string;
  data: PostData;
  filePath?: string;
};

export const RESERVED_PAGE_SLUGS: string[];

export function humanize(value: string): string;
export function slugify(value: string): string;
export function isValidDate(value: string): boolean;
export function normalizeDate(value: unknown): string;
export function readingMinutesFromBody(body: string): number;
export function normalizePost(slug: string, data: PostData, body: string): NormalizedPost;
export function normalizePage(slug: string, data: PostData, body: string): NormalizedPage;
export function validatePostEntries(entries: ContentEntry[]): string[];
export function validateContentPages(entries: ContentEntry[]): string[];
