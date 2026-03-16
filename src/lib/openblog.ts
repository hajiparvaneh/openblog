import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

export type Post = {
  slug: string;
  category: string;
  categoryLabel: string;
  title: string;
  description: string;
  date: string;
  thumbnail?: string;
  thumbnailAlt?: string;
  tags: string[];
  draft: boolean;
  featured: boolean;
  lang: string;
  translateOf?: string;
  body: string;
  qualityScore: number;
};

export type TagRecord = {
  slug: string;
  label: string;
  postCount: number;
};

export const POST_QUALITY_MAX_SCORE = 5;
export const POST_QUALITY_MINIMUM_DEPTH_WORDS = 220;

export type PostQualityReport = {
  score: number;
  maxScore: number;
  wordCount: number;
  minimumDepthWords: number;
  hasRicherText: boolean;
  hasReferences: boolean;
  hasPracticalExample: boolean;
};

type EventContributionRecord = {
  postSlug: string;
  points: number;
  labels: string[];
};

type RawEventRecord = {
  prNumber: number;
  username: string;
  userAvatarUrl?: string;
  mergedAt: string;
  postSlug?: string;
  points?: number;
  labels?: string[];
  contributions?: EventContributionRecord[];
};

type EventRecord = {
  prNumber: number;
  username: string;
  userAvatarUrl?: string;
  postSlug: string;
  points: number;
  labels: string[];
  mergedAt: string;
};

type UserRecord = { username: string; avatarUrl?: string | null; totalPoints: number; acceptedPrs: number };
export type CategoryLeaderboardRecord = UserRecord & {
  totalContributions: number;
  totalPostsContributed: number;
};

export type UserContributedPostRecord = {
  postSlug: string;
  postTitle: string;
  postExists: boolean;
  totalPoints: number;
  contributions: number;
  acceptedPrNumbers: number[];
  firstContributedAt: string;
  lastContributedAt: string;
};

export type UserProfileRecord = {
  username: string;
  profileUrl: string;
  avatarUrl?: string | null;
  totalPoints: number;
  acceptedPrs: number;
  acceptedPrNumbers: number[];
  postsContributed: number;
  totalContributions: number;
  joinedAt: string | null;
  lastContributionAt: string | null;
  contributedPosts: UserContributedPostRecord[];
};

export type LatestContributorRecord = {
  username: string;
  profileUrl: string;
  avatarUrl?: string | null;
  lastContributionAt: string;
};

export type LatestCategoryContributorRecord = LatestContributorRecord & {
  latestPostSlug: string;
  latestPostTitle: string;
  totalContributions: number;
  totalPostsContributed: number;
};

type PostContributorPrRecord = {
  prNumber: number;
  points: number;
  labels: string[];
  mergedAt: string;
};

type PostContributorRecord = UserRecord & {
  labels: string[];
  pullRequests: PostContributorPrRecord[];
};

function isCategoryLeaderboardRecord(entry: unknown): entry is CategoryLeaderboardRecord {
  if (!entry || typeof entry !== 'object') return false;

  const candidate = entry as Partial<CategoryLeaderboardRecord>;
  return (
    typeof candidate.username === 'string' &&
    typeof candidate.totalPoints === 'number' &&
    typeof candidate.acceptedPrs === 'number' &&
    typeof candidate.totalContributions === 'number' &&
    typeof candidate.totalPostsContributed === 'number'
  );
}

const ROOT = process.cwd();
const POSTS_DIR = path.join(ROOT, 'content/posts');
const GENERATED_USERS_DIR = path.join(ROOT, 'openblog/generated/users');
const GENERATED_CATEGORIES_DIR = path.join(ROOT, 'openblog/generated/categories');
const EVENTS_DIR = path.join(ROOT, 'openblog/events');

export function normalizeCategoryKey(category: string): string {
  return category.trim().toLowerCase().replace(/[\s_]+/g, '-');
}

export function formatCategoryLabel(category: string): string {
  return normalizeCategoryKey(category)
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function getCategoryPath(category: string): string {
  return `/categories/${encodeURIComponent(normalizeCategoryKey(category))}`;
}

export function slugifyTag(tag: string): string {
  return tag
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

export function getTagPath(tag: string): string {
  const slug = slugifyTag(tag);
  return `/tag/${encodeURIComponent(slug)}`;
}

export function getTagPathBySlug(tagSlug: string): string {
  return `/tag/${encodeURIComponent(slugifyTag(tagSlug))}`;
}

function normalizeUsernameHandle(username: string): string {
  return username.trim().replace(/^@+/, '');
}

export function getProfilePath(username: string): string {
  return `/profile/@${normalizeUsernameHandle(username)}`;
}

export function getProfileContributionsPath(username: string): string {
  return `/@${normalizeUsernameHandle(username)}/contributions`;
}

export function getContributedPostSlugsByUser(usernameOrHandle: string): string[] {
  const normalizedLookup = normalizeUsernameHandle(usernameOrHandle).toLowerCase();
  if (!normalizedLookup || !fs.existsSync(EVENTS_DIR)) return [];
  const knownSlugs = new Set(getPosts().map((post) => post.slug));
  const latestByPost = new Map<string, string>();

  for (const file of fs.readdirSync(EVENTS_DIR)) {
    if (!file.endsWith('.json')) continue;
    const event = JSON.parse(fs.readFileSync(path.join(EVENTS_DIR, file), 'utf8')) as RawEventRecord;
    if (!event.username || !event.mergedAt) continue;
    if (event.username.toLowerCase() !== normalizedLookup) continue;

    for (const contribution of getEventContributions(event)) {
      const resolvedPostSlug = resolvePostSlug(contribution.postSlug, knownSlugs);
      if (!resolvedPostSlug) continue;
      const current = latestByPost.get(resolvedPostSlug);
      if (!current || event.mergedAt > current) {
        latestByPost.set(resolvedPostSlug, event.mergedAt);
      }
    }
  }

  return [...latestByPost.entries()]
    .sort((a, b) => b[1].localeCompare(a[1]) || a[0].localeCompare(b[0]))
    .map(([postSlug]) => postSlug);
}

function toDateString(value: unknown): string {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '' : value.toISOString().slice(0, 10);
  }

  if (typeof value === 'string') {
    const dateValue = value.trim();
    if (!dateValue) return '';

    const isoPrefix = dateValue.match(/^(\d{4}-\d{2}-\d{2})/);
    if (isoPrefix) return isoPrefix[1];

    const parsed = new Date(dateValue);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }

    return dateValue;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
  }

  return '';
}

export function formatPostDate(value: unknown): string {
  return toDateString(value);
}

function toTrimmedString(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value).trim();
  return '';
}

function toOptionalString(value: unknown): string | undefined {
  const normalized = toTrimmedString(value);
  return normalized || undefined;
}

function toBoolean(value: unknown, defaultValue: boolean): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return defaultValue;
    if (['true', '1', 'yes'].includes(normalized)) return true;
    if (['false', '0', 'no'].includes(normalized)) return false;
  }
  return defaultValue;
}

function normalizeLanguage(value: unknown): string {
  const normalized = toTrimmedString(value)
    .replace(/_/g, '-')
    .toLowerCase();
  return normalized || 'en';
}

function normalizeTags(value: unknown): string[] {
  const rawTokens: string[] = [];
  if (typeof value === 'string') {
    rawTokens.push(...value.split(/[,\n]/g));
  } else if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item !== 'string') continue;
      rawTokens.push(...item.split(/[,\n]/g));
    }
  }

  const seen = new Set<string>();
  const tags: string[] = [];
  for (const token of rawTokens) {
    const normalized = token.trim().replace(/\s+/g, ' ');
    if (!normalized) continue;
    const dedupeKey = normalized.toLowerCase();
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    tags.push(normalized);
  }

  return tags;
}

function normalizeTranslateOf(
  value: unknown,
  context: { categoryDir: string; postPath: string; rawCategory: string; postName: string }
): string | undefined {
  const rawValue = toTrimmedString(value);
  if (!rawValue) return undefined;

  const normalizedRelativePath = rawValue.replace(/\\/g, '/');
  if (!normalizedRelativePath.endsWith('.md')) {
    throw new Error(
      `Invalid translateOf in ${context.postPath}: "${rawValue}" must point to a .md file in the same folder.`
    );
  }

  if (path.isAbsolute(normalizedRelativePath)) {
    throw new Error(
      `Invalid translateOf in ${context.postPath}: "${rawValue}" must be a relative path in the same folder.`
    );
  }

  const resolvedPath = path.resolve(context.categoryDir, normalizedRelativePath);
  if (path.dirname(resolvedPath) !== context.categoryDir) {
    throw new Error(
      `Invalid translateOf in ${context.postPath}: "${rawValue}" must reference a file in the same category folder.`
    );
  }

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(
      `Invalid translateOf in ${context.postPath}: "${rawValue}" does not exist in ${context.categoryDir}.`
    );
  }

  const targetName = path.basename(resolvedPath, '.md');
  if (targetName === context.postName) {
    throw new Error(`Invalid translateOf in ${context.postPath}: post cannot translate itself.`);
  }

  return `${context.rawCategory}/${targetName}`;
}

function markdownToPlainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`\n]*`/g, ' ')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '$1 ')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ')
    .replace(/[#>*_\-[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function evaluatePostQuality(body: string): PostQualityReport {
  const plainText = markdownToPlainText(body);
  const wordCount = plainText ? plainText.split(' ').length : 0;
  const hasRicherText = wordCount >= POST_QUALITY_MINIMUM_DEPTH_WORDS;
  const hasReferences = /\bhttps?:\/\/[^\s)]+/i.test(body);
  const hasPracticalExample =
    /```[\s\S]*?```/.test(body) ||
    /\b(for example|example:|e\.g\.)\b/i.test(body) ||
    /(^|\n)##?\s.*example/i.test(body);
  const score =
    (hasRicherText ? 2 : 0) +
    (hasReferences ? 2 : 0) +
    (hasPracticalExample ? 1 : 0);

  return {
    score,
    maxScore: POST_QUALITY_MAX_SCORE,
    wordCount,
    minimumDepthWords: POST_QUALITY_MINIMUM_DEPTH_WORDS,
    hasRicherText,
    hasReferences,
    hasPracticalExample
  };
}

function resolvePostSlug(postSlug: string, availableSlugs: Set<string>): string | null {
  const raw = postSlug.trim().replace(/\\/g, '/');
  if (!raw) return null;

  const candidates = new Set<string>([raw]);
  const withoutMd = raw.replace(/\.md$/i, '');
  candidates.add(withoutMd);
  candidates.add(withoutMd.replace(/^content\/posts\//i, ''));
  candidates.add(withoutMd.replace(/^\/+/, ''));

  for (const candidate of candidates) {
    if (availableSlugs.has(candidate)) return candidate;
  }

  const leaf = withoutMd.split('/').filter(Boolean).at(-1);
  if (!leaf) return null;
  const matches = [...availableSlugs].filter((slug) => slug.endsWith(`/${leaf}`));
  return matches.length === 1 ? matches[0] : null;
}

function normalizeEventContribution(raw: unknown): EventContributionRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const candidate = raw as Partial<EventContributionRecord>;
  if (typeof candidate.postSlug !== 'string' || !candidate.postSlug.trim()) return null;
  const labels = Array.isArray(candidate.labels) ? candidate.labels.filter((label): label is string => typeof label === 'string') : [];
  const points = typeof candidate.points === 'number' && Number.isFinite(candidate.points) ? candidate.points : 0;
  return {
    postSlug: candidate.postSlug,
    points,
    labels
  };
}

function getEventContributions(event: RawEventRecord): EventContributionRecord[] {
  if (Array.isArray(event.contributions) && event.contributions.length > 0) {
    return event.contributions
      .map((item) => normalizeEventContribution(item))
      .filter((item): item is EventContributionRecord => item !== null);
  }

  if (typeof event.postSlug === 'string' && event.postSlug.trim()) {
    const labels = Array.isArray(event.labels) ? event.labels.filter((label): label is string => typeof label === 'string') : [];
    const points = typeof event.points === 'number' && Number.isFinite(event.points) ? event.points : 0;
    return [{ postSlug: event.postSlug, points, labels }];
  }

  return [];
}

export function getPosts(): Post[] {
  if (!fs.existsSync(POSTS_DIR)) return [];

  const entries = fs.readdirSync(POSTS_DIR, { withFileTypes: true });
  const rootMarkdownFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.md'));
  if (rootMarkdownFiles.length > 0) {
    const fileList = rootMarkdownFiles.map((file) => file.name).join(', ');
    throw new Error(`Posts must be stored under content/posts/<category>/<post>.md. Move: ${fileList}`);
  }

  const posts: Post[] = [];

  for (const categoryEntry of entries) {
    if (!categoryEntry.isDirectory()) continue;

    const rawCategory = categoryEntry.name;
    const category = normalizeCategoryKey(rawCategory);
    const categoryLabel = formatCategoryLabel(rawCategory);
    const categoryDir = path.join(POSTS_DIR, rawCategory);
    for (const postEntry of fs.readdirSync(categoryDir, { withFileTypes: true })) {
      if (postEntry.isDirectory()) {
        throw new Error(
          `Nested folders are not supported in content/posts. Found: ${rawCategory}/${postEntry.name}`
        );
      }

      if (!postEntry.isFile() || !postEntry.name.endsWith('.md')) continue;

      const postPath = path.join(categoryDir, postEntry.name);
      const raw = fs.readFileSync(postPath, 'utf8');
      const { data, content } = matter(raw);
      const postName = postEntry.name.replace(/\.md$/, '');
      const body = content.trim();
      const quality = evaluatePostQuality(body);
      const draft = toBoolean(data.draft, false);
      if (draft) continue;
      const thumbnail = toOptionalString(data.thumbnail);
      const thumbnailAlt = toOptionalString(data.thumbnailAlt);
      const translateOf = normalizeTranslateOf(data.translateOf, {
        categoryDir,
        postPath,
        rawCategory,
        postName
      });

      posts.push({
        slug: `${rawCategory}/${postName}`,
        category,
        categoryLabel,
        title: toTrimmedString(data.title) || postName,
        description: toTrimmedString(data.description),
        date: toDateString(data.date),
        thumbnail,
        thumbnailAlt,
        tags: normalizeTags(data.tags),
        draft,
        featured: toBoolean(data.featured, false),
        lang: normalizeLanguage(data.lang),
        translateOf,
        body,
        qualityScore: quality.score
      });
    }
  }

  return posts.sort((a, b) => b.date.localeCompare(a.date));
}

export function getPostBySlug(slug: string): Post | undefined {
  return getPosts().find((post) => post.slug === slug);
}

export function getPostsByTagSlug(tagSlug: string): Post[] {
  const normalizedTagSlug = slugifyTag(tagSlug);
  if (!normalizedTagSlug) return [];

  return getPosts().filter((post) =>
    post.tags.some((tag) => slugifyTag(tag) === normalizedTagSlug)
  );
}

export function getTagRecords(): TagRecord[] {
  const tagMap = new Map<string, TagRecord>();

  for (const post of getPosts()) {
    for (const tag of post.tags) {
      const slug = slugifyTag(tag);
      if (!slug) continue;

      const existing = tagMap.get(slug);
      if (existing) {
        existing.postCount += 1;
      } else {
        tagMap.set(slug, {
          slug,
          label: tag,
          postCount: 1
        });
      }
    }
  }

  return [...tagMap.values()].sort((a, b) => a.label.localeCompare(b.label));
}

export function getTagLabelBySlug(tagSlug: string): string | undefined {
  const normalizedTagSlug = slugifyTag(tagSlug);
  if (!normalizedTagSlug) return undefined;

  return getTagRecords().find((tag) => tag.slug === normalizedTagSlug)?.label;
}

export function getLeaderboard(): UserRecord[] {
  const p = path.join(ROOT, 'openblog/generated/leaderboard.json');
  if (!fs.existsSync(p)) return [];
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  return data.leaderboard ?? [];
}

export function getCategoryLeaderboard(category: string): CategoryLeaderboardRecord[] {
  const normalizedCategory = normalizeCategoryKey(category);
  const categoryLeaderboardPath = path.join(GENERATED_CATEGORIES_DIR, `${normalizedCategory}.json`);
  if (!fs.existsSync(categoryLeaderboardPath)) return [];

  const data = JSON.parse(fs.readFileSync(categoryLeaderboardPath, 'utf8'));
  if (!Array.isArray(data.leaderboard)) return [];

  return data.leaderboard.filter((entry: unknown): entry is CategoryLeaderboardRecord =>
    isCategoryLeaderboardRecord(entry)
  );
}

export function getUserPostContributionCounts(): Record<string, number> {
  if (!fs.existsSync(EVENTS_DIR)) return {};

  const counts: Record<string, number> = {};

  for (const file of fs.readdirSync(EVENTS_DIR)) {
    if (!file.endsWith('.json')) continue;

    const event = JSON.parse(fs.readFileSync(path.join(EVENTS_DIR, file), 'utf8')) as RawEventRecord;
    if (!event.username) continue;

    const contributions = getEventContributions(event);
    if (contributions.length === 0) continue;

    counts[event.username] = (counts[event.username] ?? 0) + contributions.length;
  }

  return counts;
}

export function getKnownContributors(): string[] {
  const byLowercase = new Map<string, string>();

  for (const user of getLeaderboard()) {
    byLowercase.set(user.username.toLowerCase(), user.username);
  }

  if (fs.existsSync(EVENTS_DIR)) {
    for (const file of fs.readdirSync(EVENTS_DIR)) {
      if (!file.endsWith('.json')) continue;
      const event = JSON.parse(fs.readFileSync(path.join(EVENTS_DIR, file), 'utf8')) as RawEventRecord;
      if (!event.username) continue;
      const key = event.username.toLowerCase();
      if (!byLowercase.has(key)) {
        byLowercase.set(key, event.username);
      }
    }
  }

  return [...byLowercase.values()].sort((a, b) => a.localeCompare(b));
}

export function getUserProfile(usernameOrHandle: string): UserProfileRecord | null {
  const normalizedInput = normalizeUsernameHandle(usernameOrHandle);
  if (!normalizedInput) return null;

  const normalizedLookup = normalizedInput.toLowerCase();
  const leaderboardEntry = getLeaderboard().find((entry) => entry.username.toLowerCase() === normalizedLookup);

  const posts = getPosts();
  const postBySlug = new Map(posts.map((post) => [post.slug, post]));
  const knownSlugs = new Set(posts.map((post) => post.slug));

  if (!fs.existsSync(EVENTS_DIR) && !leaderboardEntry) return null;

  let canonicalUsername = leaderboardEntry?.username ?? normalizedInput;
  let avatarUrl = leaderboardEntry?.avatarUrl ?? null;
  let joinedAt: string | null = null;
  let lastContributionAt: string | null = null;
  let calculatedTotalPoints = 0;
  let totalContributions = 0;
  const acceptedPrNumbers = new Set<number>();
  const contributionsByPost = new Map<string, {
    postSlug: string;
    totalPoints: number;
    contributions: number;
    acceptedPrNumbers: Set<number>;
    firstContributedAt: string;
    lastContributedAt: string;
  }>();

  if (fs.existsSync(EVENTS_DIR)) {
    for (const file of fs.readdirSync(EVENTS_DIR)) {
      if (!file.endsWith('.json')) continue;

      const event = JSON.parse(fs.readFileSync(path.join(EVENTS_DIR, file), 'utf8')) as RawEventRecord;
      if (!event.username || !event.mergedAt || !Number.isFinite(event.prNumber)) continue;
      if (event.username.toLowerCase() !== normalizedLookup) continue;

      canonicalUsername = event.username;
      if (event.userAvatarUrl) {
        avatarUrl = event.userAvatarUrl;
      }

      const contributions = getEventContributions(event);
      if (contributions.length === 0) continue;

      if (!joinedAt || event.mergedAt < joinedAt) {
        joinedAt = event.mergedAt;
      }
      if (!lastContributionAt || event.mergedAt > lastContributionAt) {
        lastContributionAt = event.mergedAt;
      }

      acceptedPrNumbers.add(event.prNumber);
      for (const contribution of contributions) {
        const resolvedPostSlug = resolvePostSlug(contribution.postSlug, knownSlugs) ?? contribution.postSlug;
        const current = contributionsByPost.get(resolvedPostSlug) ?? {
          postSlug: resolvedPostSlug,
          totalPoints: 0,
          contributions: 0,
          acceptedPrNumbers: new Set<number>(),
          firstContributedAt: event.mergedAt,
          lastContributedAt: event.mergedAt
        };

        current.totalPoints += contribution.points;
        current.contributions += 1;
        current.acceptedPrNumbers.add(event.prNumber);
        if (event.mergedAt < current.firstContributedAt) {
          current.firstContributedAt = event.mergedAt;
        }
        if (event.mergedAt > current.lastContributedAt) {
          current.lastContributedAt = event.mergedAt;
        }

        contributionsByPost.set(resolvedPostSlug, current);
        calculatedTotalPoints += contribution.points;
        totalContributions += 1;
      }
    }
  }

  const hasEventData = acceptedPrNumbers.size > 0 || totalContributions > 0;
  const contributedPosts = [...contributionsByPost.values()]
    .map((entry) => {
      const post = postBySlug.get(entry.postSlug);
      return {
        postSlug: entry.postSlug,
        postTitle: post?.title ?? entry.postSlug,
        postExists: Boolean(post),
        totalPoints: entry.totalPoints,
        contributions: entry.contributions,
        acceptedPrNumbers: [...entry.acceptedPrNumbers].sort((a, b) => b - a),
        firstContributedAt: entry.firstContributedAt,
        lastContributedAt: entry.lastContributedAt
      } satisfies UserContributedPostRecord;
    })
    .sort(
      (a, b) =>
        b.lastContributedAt.localeCompare(a.lastContributedAt) ||
        b.totalPoints - a.totalPoints ||
        a.postSlug.localeCompare(b.postSlug)
    );

  if (!hasEventData && !leaderboardEntry) return null;

  return {
    username: canonicalUsername,
    profileUrl: `https://github.com/${canonicalUsername}`,
    avatarUrl,
    totalPoints: hasEventData ? calculatedTotalPoints : (leaderboardEntry?.totalPoints ?? 0),
    acceptedPrs: hasEventData ? acceptedPrNumbers.size : (leaderboardEntry?.acceptedPrs ?? 0),
    acceptedPrNumbers: [...acceptedPrNumbers].sort((a, b) => b - a),
    postsContributed: contributedPosts.length,
    totalContributions,
    joinedAt,
    lastContributionAt,
    contributedPosts
  };
}

export function getContributorsForPost(postSlug: string): PostContributorRecord[] {
  if (!fs.existsSync(EVENTS_DIR)) return [];
  const knownSlugs = new Set(getPosts().map((post) => post.slug));

  const byUser = new Map<string, {
    avatarUrl: string | null;
    totalPoints: number;
    acceptedPrs: number;
    acceptedPrNumbers: Set<number>;
    labels: Set<string>;
    pullRequestsByNumber: Map<number, {
      prNumber: number;
      points: number;
      labels: Set<string>;
      mergedAt: string;
    }>;
  }>();

  for (const file of fs.readdirSync(EVENTS_DIR)) {
    if (!file.endsWith('.json')) continue;
    const event = JSON.parse(fs.readFileSync(path.join(EVENTS_DIR, file), 'utf8')) as RawEventRecord;
    if (!event.username || !event.mergedAt || !Number.isFinite(event.prNumber)) continue;
    const contributions = getEventContributions(event);

    const current = byUser.get(event.username) ?? {
      avatarUrl: null,
      totalPoints: 0,
      acceptedPrs: 0,
      acceptedPrNumbers: new Set<number>(),
      labels: new Set<string>(),
      pullRequestsByNumber: new Map<number, {
        prNumber: number;
        points: number;
        labels: Set<string>;
        mergedAt: string;
      }>()
    };

    if (event.userAvatarUrl) {
      current.avatarUrl = event.userAvatarUrl;
    }

    let matchedContribution = false;
    for (const contribution of contributions) {
      const resolvedPostSlug = resolvePostSlug(contribution.postSlug, knownSlugs);
      if (resolvedPostSlug !== postSlug) continue;
      matchedContribution = true;

      current.totalPoints += contribution.points;
      current.acceptedPrNumbers.add(event.prNumber);
      current.acceptedPrs = current.acceptedPrNumbers.size;
      contribution.labels.forEach((label) => current.labels.add(label));

      const existingPullRequest = current.pullRequestsByNumber.get(event.prNumber);
      if (existingPullRequest) {
        existingPullRequest.points += contribution.points;
        contribution.labels.forEach((label) => existingPullRequest.labels.add(label));
        if (event.mergedAt > existingPullRequest.mergedAt) {
          existingPullRequest.mergedAt = event.mergedAt;
        }
      } else {
        current.pullRequestsByNumber.set(event.prNumber, {
          prNumber: event.prNumber,
          points: contribution.points,
          labels: new Set<string>(contribution.labels),
          mergedAt: event.mergedAt
        });
      }
    }
    if (matchedContribution || byUser.has(event.username)) {
      byUser.set(event.username, current);
    }
  }

  return [...byUser.entries()]
    .map(([username, info]) => ({
      username,
      avatarUrl: info.avatarUrl,
      totalPoints: info.totalPoints,
      acceptedPrs: info.acceptedPrs,
      labels: [...info.labels].sort((a, b) => a.localeCompare(b)),
      pullRequests: [...info.pullRequestsByNumber.values()]
        .map((pullRequest) => ({
          prNumber: pullRequest.prNumber,
          points: pullRequest.points,
          labels: [...pullRequest.labels].sort((a, b) => a.localeCompare(b)),
          mergedAt: pullRequest.mergedAt
        }))
        .sort((a, b) => b.mergedAt.localeCompare(a.mergedAt))
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints || b.acceptedPrs - a.acceptedPrs || a.username.localeCompare(b.username));
}

export function getRecentEvents(limit = 10): EventRecord[] {
  if (!fs.existsSync(EVENTS_DIR)) return [];
  const knownSlugs = new Set(getPosts().map((post) => post.slug));

  return fs
    .readdirSync(EVENTS_DIR)
    .filter((file) => file.endsWith('.json'))
    .flatMap((file) => {
      const event = JSON.parse(fs.readFileSync(path.join(EVENTS_DIR, file), 'utf8')) as RawEventRecord;
      if (!event.username || !event.mergedAt || !Number.isFinite(event.prNumber)) return [];
      return getEventContributions(event).map((contribution) => {
        const resolvedPostSlug = resolvePostSlug(contribution.postSlug, knownSlugs) ?? contribution.postSlug;
        return {
          prNumber: event.prNumber,
          username: event.username,
          userAvatarUrl: event.userAvatarUrl,
          postSlug: resolvedPostSlug,
          points: contribution.points,
          labels: contribution.labels,
          mergedAt: event.mergedAt
        } satisfies EventRecord;
      });
    })
    .sort((a, b) => b.mergedAt.localeCompare(a.mergedAt))
    .slice(0, limit);
}

type GeneratedUserRecord = {
  username: string;
  profileUrl?: string;
  avatarUrl?: string | null;
  lastUpdatedAt?: string;
  lastContribution?: { mergedAt?: string } | null;
};

export function getLatestContributors(limit = 8): LatestContributorRecord[] {
  const users: LatestContributorRecord[] = [];
  if (fs.existsSync(GENERATED_USERS_DIR)) {
    for (const file of fs.readdirSync(GENERATED_USERS_DIR)) {
      if (!file.endsWith('.json')) continue;

      const raw = JSON.parse(fs.readFileSync(path.join(GENERATED_USERS_DIR, file), 'utf8')) as GeneratedUserRecord;
      if (!raw.username) continue;

      const lastContributionAt = raw.lastContribution?.mergedAt ?? raw.lastUpdatedAt;
      if (!lastContributionAt) continue;

      users.push({
        username: raw.username,
        profileUrl: raw.profileUrl ?? `https://github.com/${raw.username}`,
        avatarUrl: raw.avatarUrl ?? null,
        lastContributionAt
      });
    }
  } else if (fs.existsSync(EVENTS_DIR)) {
    const latestByUser = new Map<string, LatestContributorRecord>();
    for (const file of fs.readdirSync(EVENTS_DIR)) {
      if (!file.endsWith('.json')) continue;
      const event = JSON.parse(fs.readFileSync(path.join(EVENTS_DIR, file), 'utf8')) as RawEventRecord;
      if (!event.username || !event.mergedAt) continue;

      const current = latestByUser.get(event.username);
      if (!current || event.mergedAt > current.lastContributionAt) {
        latestByUser.set(event.username, {
          username: event.username,
          profileUrl: `https://github.com/${event.username}`,
          avatarUrl: event.userAvatarUrl ?? null,
          lastContributionAt: event.mergedAt
        });
      }
    }
    users.push(...latestByUser.values());
  }

  return users
    .sort((a, b) => b.lastContributionAt.localeCompare(a.lastContributionAt) || a.username.localeCompare(b.username))
    .slice(0, limit);
}

export function getLatestContributorByPost(): Map<string, LatestContributorRecord> {
  const latestByPost = new Map<string, LatestContributorRecord>();
  if (!fs.existsSync(EVENTS_DIR)) return latestByPost;
  const knownSlugs = new Set(getPosts().map((post) => post.slug));

  for (const file of fs.readdirSync(EVENTS_DIR)) {
    if (!file.endsWith('.json')) continue;
    const event = JSON.parse(fs.readFileSync(path.join(EVENTS_DIR, file), 'utf8')) as RawEventRecord;
    if (!event.username || !event.mergedAt) continue;

    for (const contribution of getEventContributions(event)) {
      const resolvedPostSlug = resolvePostSlug(contribution.postSlug, knownSlugs);
      if (!resolvedPostSlug) continue;

      const current = latestByPost.get(resolvedPostSlug);
      if (
        !current ||
        event.mergedAt > current.lastContributionAt ||
        (event.mergedAt === current.lastContributionAt && event.username.localeCompare(current.username) < 0)
      ) {
        latestByPost.set(resolvedPostSlug, {
          username: event.username,
          profileUrl: `https://github.com/${event.username}`,
          avatarUrl: event.userAvatarUrl ?? null,
          lastContributionAt: event.mergedAt
        });
      }
    }
  }

  return latestByPost;
}

export function getLatestContributorsForPost(postSlug: string, limit = 5): LatestContributorRecord[] {
  if (!fs.existsSync(EVENTS_DIR)) return [];
  const knownSlugs = new Set(getPosts().map((post) => post.slug));
  const latestByUser = new Map<string, LatestContributorRecord>();

  for (const file of fs.readdirSync(EVENTS_DIR)) {
    if (!file.endsWith('.json')) continue;
    const event = JSON.parse(fs.readFileSync(path.join(EVENTS_DIR, file), 'utf8')) as RawEventRecord;
    if (!event.username || !event.mergedAt) continue;

    const hasContributionForPost = getEventContributions(event).some((contribution) => {
      const resolvedPostSlug = resolvePostSlug(contribution.postSlug, knownSlugs);
      return resolvedPostSlug === postSlug;
    });
    if (!hasContributionForPost) continue;

    const current = latestByUser.get(event.username);
    if (!current || event.mergedAt > current.lastContributionAt) {
      latestByUser.set(event.username, {
        username: event.username,
        profileUrl: `https://github.com/${event.username}`,
        avatarUrl: event.userAvatarUrl ?? null,
        lastContributionAt: event.mergedAt
      });
    }
  }

  return [...latestByUser.values()]
    .sort((a, b) => b.lastContributionAt.localeCompare(a.lastContributionAt) || a.username.localeCompare(b.username))
    .slice(0, limit);
}

export function getLatestContributorsForCategory(category: string, limit = 6): LatestCategoryContributorRecord[] {
  if (!fs.existsSync(EVENTS_DIR)) return [];
  const normalizedCategory = normalizeCategoryKey(category);
  const posts = getPosts();
  const postBySlug = new Map(posts.map((post) => [post.slug, post]));
  const knownSlugs = new Set(postBySlug.keys());
  const latestByUser = new Map<
    string,
    {
      username: string;
      avatarUrl: string | null;
      lastContributionAt: string;
      latestPostSlug: string;
      latestPostTitle: string;
      totalContributions: number;
      contributedPosts: Set<string>;
    }
  >();

  for (const file of fs.readdirSync(EVENTS_DIR)) {
    if (!file.endsWith('.json')) continue;
    const event = JSON.parse(fs.readFileSync(path.join(EVENTS_DIR, file), 'utf8')) as RawEventRecord;
    if (!event.username || !event.mergedAt) continue;

    for (const contribution of getEventContributions(event)) {
      const resolvedPostSlug = resolvePostSlug(contribution.postSlug, knownSlugs);
      if (!resolvedPostSlug) continue;

      const post = postBySlug.get(resolvedPostSlug);
      if (!post || post.category !== normalizedCategory) continue;

      const current = latestByUser.get(event.username) ?? {
        username: event.username,
        avatarUrl: null,
        lastContributionAt: '',
        latestPostSlug: resolvedPostSlug,
        latestPostTitle: post.title,
        totalContributions: 0,
        contributedPosts: new Set<string>()
      };

      current.totalContributions += 1;
      current.contributedPosts.add(resolvedPostSlug);
      if (event.userAvatarUrl) {
        current.avatarUrl = event.userAvatarUrl;
      }

      if (
        !current.lastContributionAt ||
        event.mergedAt > current.lastContributionAt ||
        (event.mergedAt === current.lastContributionAt && resolvedPostSlug.localeCompare(current.latestPostSlug) < 0)
      ) {
        current.lastContributionAt = event.mergedAt;
        current.latestPostSlug = resolvedPostSlug;
        current.latestPostTitle = post.title;
      }

      latestByUser.set(event.username, current);
    }
  }

  return [...latestByUser.values()]
    .map((entry) => ({
      username: entry.username,
      profileUrl: `https://github.com/${entry.username}`,
      avatarUrl: entry.avatarUrl,
      lastContributionAt: entry.lastContributionAt,
      latestPostSlug: entry.latestPostSlug,
      latestPostTitle: entry.latestPostTitle,
      totalContributions: entry.totalContributions,
      totalPostsContributed: entry.contributedPosts.size
    }))
    .sort(
      (a, b) =>
        b.lastContributionAt.localeCompare(a.lastContributionAt) ||
        b.totalContributions - a.totalContributions ||
        a.username.localeCompare(b.username)
    )
    .slice(0, limit);
}
