interface Env {
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  AUTH_ALLOWED_ORIGIN?: string;
}

type GitHubUser = {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
  name: string | null;
};

type GitHubBranchRef = {
  object?: {
    sha?: string;
  };
};

type GitHubRepo = {
  full_name?: string;
  parent?: {
    full_name?: string;
  };
};

type GitHubContentFile = {
  sha?: string;
};

type GitHubPullRequest = {
  html_url?: string;
  number?: number;
};

type ContributionRequestBody = {
  filePath?: unknown;
  content?: unknown;
  prTitle?: unknown;
  prBody?: unknown;
  commitMessage?: unknown;
  baseBranch?: unknown;
};

type ContributionPayload = {
  filePath: string;
  content: string;
  prTitle: string;
  prBody?: string;
  commitMessage: string;
  baseBranch: string;
};

type CreatedPullRequestResult = {
  filePath: string;
  pullRequest: {
    number: number;
    url: string;
    headBranch: string;
    baseBranch: string;
    forkRepo: string;
    targetRepo: string;
  };
};

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

class GitHubApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'GitHubApiError';
    this.status = status;
  }
}

const COOKIE_NAMES = {
  token: 'gh_token',
  state: 'oauth_state',
  returnTo: 'oauth_return_to'
} as const;

const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_UI_BASE = 'https://github.com';
const GITHUB_USER_AGENT = 'openblog-github-auth-worker';
const GITHUB_API_VERSION = '2022-11-28';
const TARGET_REPO = 'hajiparvaneh/openblog';
const DEFAULT_BASE_BRANCH = 'main';
const MAX_CONTENT_BYTES = 250_000;
const STATE_TTL_SECONDS = 600;
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

const hasValue = (value: string | undefined): boolean => {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 && normalized !== 'undefined' && normalized !== 'null';
};

const validateAuthEnv = (env: Env): string[] => {
  const missing: string[] = [];
  if (!hasValue(env.GITHUB_CLIENT_ID)) missing.push('GITHUB_CLIENT_ID');
  if (!hasValue(env.GITHUB_CLIENT_SECRET)) missing.push('GITHUB_CLIENT_SECRET');
  return missing;
};

const json = (data: unknown, status = 200, headers: HeadersInit = {}): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...headers
    }
  });

const parseCookies = (cookieHeader: string | null): Record<string, string> => {
  if (!cookieHeader) return {};

  return cookieHeader
    .split(';')
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, part) => {
      const eqIndex = part.indexOf('=');
      if (eqIndex === -1) return acc;
      const key = part.slice(0, eqIndex);
      const value = decodeURIComponent(part.slice(eqIndex + 1));
      acc[key] = value;
      return acc;
    }, {});
};

const createCookie = (
  name: string,
  value: string,
  options: {
    maxAge?: number;
    httpOnly?: boolean;
    sameSite?: 'Lax' | 'Strict' | 'None';
    secure?: boolean;
    path?: string;
  } = {}
): string => {
  const {
    maxAge,
    httpOnly = true,
    sameSite = 'Lax',
    secure = true,
    path = '/'
  } = options;

  const segments = [`${name}=${encodeURIComponent(value)}`, `Path=${path}`, `SameSite=${sameSite}`];
  if (typeof maxAge === 'number') segments.push(`Max-Age=${maxAge}`);
  if (secure) segments.push('Secure');
  if (httpOnly) segments.push('HttpOnly');

  return segments.join('; ');
};

const generateState = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

const getBaseUrl = (request: Request): string => {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
};

const normalizeOrigin = (value: string | null | undefined): string | null => {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

const getExpectedOrigin = (request: Request, env: Env): string =>
  normalizeOrigin(env.AUTH_ALLOWED_ORIGIN) ?? getBaseUrl(request);

const getAllowedCorsOrigin = (request: Request, env: Env): string | null => {
  const requestOrigin = normalizeOrigin(request.headers.get('origin'));
  if (!requestOrigin) return null;

  return requestOrigin === getExpectedOrigin(request, env) ? requestOrigin : null;
};

const assertStateChangingOrigin = (request: Request, env: Env): void => {
  const requestOrigin = normalizeOrigin(request.headers.get('origin'));
  const expectedOrigin = getExpectedOrigin(request, env);

  if (!requestOrigin || requestOrigin !== expectedOrigin) {
    throw new HttpError(403, 'Origin is not allowed');
  }
};

const getCorsHeaders = (request: Request, env: Env): HeadersInit => {
  const allowedOrigin = getAllowedCorsOrigin(request, env);
  if (!allowedOrigin) return {};

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Credentials': 'true',
    Vary: 'Origin'
  };
};

const getTokenCookieSameSite = (env: Env): 'Lax' | 'None' =>
  normalizeOrigin(env.AUTH_ALLOWED_ORIGIN) ? 'None' : 'Lax';

const sanitizeReturnTo = (candidate: string | null, request: Request, env: Env): string | null => {
  if (!candidate) return null;

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return null;
  }

  if (parsed.origin !== getExpectedOrigin(request, env)) {
    return null;
  }

  return parsed.toString();
};

const buildAuthorizeUrl = (request: Request, env: Env, state: string): string => {
  const callbackUrl = `${getBaseUrl(request)}/callback`;
  const authorizeUrl = new URL('https://github.com/login/oauth/authorize');

  authorizeUrl.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
  authorizeUrl.searchParams.set('redirect_uri', callbackUrl);
  authorizeUrl.searchParams.set('scope', 'read:user public_repo');
  authorizeUrl.searchParams.set('state', state);

  return authorizeUrl.toString();
};

const exchangeCodeForToken = async (code: string, request: Request, env: Env): Promise<string> => {
  const callbackUrl = `${getBaseUrl(request)}/callback`;

  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: callbackUrl
    })
  });

  if (!response.ok) {
    throw new Error(`Token exchange failed with status ${response.status}`);
  }

  const tokenData = (await response.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!tokenData.access_token) {
    throw new Error(tokenData.error_description ?? tokenData.error ?? 'No access token returned by GitHub');
  }

  return tokenData.access_token;
};

const toOptionalTrimmedString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  return normalized || undefined;
};

const toBase64 = (value: string): string => {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
};

const normalizeBranchName = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9/-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^[-/]+|[-/]+$/g, '');

const sanitizeBaseBranch = (value: unknown): string => {
  const normalized = normalizeBranchName(String(value ?? DEFAULT_BASE_BRANCH));
  return normalized || DEFAULT_BASE_BRANCH;
};

const sanitizeMarkdownFilePath = (value: unknown): string => {
  if (typeof value !== 'string') {
    throw new HttpError(400, 'filePath must be a string');
  }

  const normalized = value.trim().replace(/\\/g, '/').replace(/^\/+/, '');
  const segments = normalized.split('/').filter(Boolean);

  if (segments.length !== 4 || segments[0] !== 'content' || segments[1] !== 'posts') {
    throw new HttpError(400, 'filePath must match content/posts/<category>/<post>.md');
  }

  const category = segments[2].toLowerCase();
  const fileName = segments[3].toLowerCase();

  if (!/^[a-z0-9-]+$/.test(category)) {
    throw new HttpError(400, 'Category must use lowercase letters, numbers, and hyphens');
  }

  if (!/^[a-z0-9-]+\.md$/.test(fileName)) {
    throw new HttpError(400, 'Post file must end with .md and use lowercase letters, numbers, and hyphens');
  }

  return `content/posts/${category}/${fileName}`;
};

const parseContributionPayload = async (request: Request): Promise<ContributionPayload> => {
  let parsed: ContributionRequestBody;
  try {
    parsed = (await request.json()) as ContributionRequestBody;
  } catch {
    throw new HttpError(400, 'Invalid JSON payload');
  }

  const filePath = sanitizeMarkdownFilePath(parsed.filePath);

  if (typeof parsed.content !== 'string') {
    throw new HttpError(400, 'content must be a string');
  }

  const content = parsed.content;
  if (!content.trim()) {
    throw new HttpError(400, 'content cannot be empty');
  }

  const contentSize = new TextEncoder().encode(content).byteLength;
  if (contentSize > MAX_CONTENT_BYTES) {
    throw new HttpError(400, `content is too large (max ${MAX_CONTENT_BYTES} bytes)`);
  }

  const prTitle = toOptionalTrimmedString(parsed.prTitle) ?? `Improve ${filePath}`;
  if (prTitle.length > 120) {
    throw new HttpError(400, 'prTitle is too long (max 120 characters)');
  }

  const fileSlug = filePath.replace(/^content\/posts\//, '').replace(/\.md$/, '');
  const prBody = toOptionalTrimmedString(parsed.prBody);
  const commitMessage =
    toOptionalTrimmedString(parsed.commitMessage) ?? `docs: update ${fileSlug}`;
  const baseBranch = sanitizeBaseBranch(parsed.baseBranch);

  return {
    filePath,
    content,
    prTitle,
    prBody,
    commitMessage,
    baseBranch
  };
};

const splitRepo = (repo: string): { owner: string; repoName: string } => {
  const [owner, repoName, extra] = repo.trim().split('/');
  if (!owner || !repoName || extra) {
    throw new Error('Invalid repo format. Expected owner/repo');
  }

  return { owner, repoName };
};

const encodePathSegments = (value: string): string =>
  value
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/');

const sleep = async (ms: number): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, ms));
};

const githubRequest = async (
  token: string,
  path: string,
  init: RequestInit = {}
): Promise<Response> => {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/vnd.github+json');
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('User-Agent', GITHUB_USER_AGENT);
  headers.set('X-GitHub-Api-Version', GITHUB_API_VERSION);

  return fetch(`${GITHUB_API_BASE}${path}`, {
    ...init,
    headers
  });
};

const parseGitHubErrorMessage = async (response: Response): Promise<string> => {
  const raw = await response.text();
  if (!raw) return `GitHub API request failed with status ${response.status}`;

  try {
    const parsed = JSON.parse(raw) as { message?: string };
    if (typeof parsed.message === 'string' && parsed.message.trim()) {
      return parsed.message.trim();
    }
  } catch {
    // Ignore parse errors and fall back to raw.
  }

  return raw.slice(0, 220);
};

const requireGitHubOk = async (
  response: Response,
  expectedStatuses: number[],
  context: string
): Promise<void> => {
  if (expectedStatuses.includes(response.status)) return;

  const details = await parseGitHubErrorMessage(response);
  throw new GitHubApiError(response.status, `${context}: ${details}`);
};

const fetchAuthenticatedUser = async (token: string): Promise<GitHubUser> => {
  const response = await githubRequest(token, '/user');
  await requireGitHubOk(response, [200], 'Failed to fetch GitHub user');
  return (await response.json()) as GitHubUser;
};

const getBranchSha = async (
  token: string,
  owner: string,
  repoName: string,
  branch: string
): Promise<string> => {
  const encodedBranch = encodeURIComponent(branch);
  const response = await githubRequest(token, `/repos/${owner}/${repoName}/git/ref/heads/${encodedBranch}`);
  await requireGitHubOk(response, [200], 'Unable to read base branch');
  const payload = (await response.json()) as GitHubBranchRef;
  const sha = payload.object?.sha;
  if (!sha) {
    throw new GitHubApiError(502, 'GitHub did not return a branch SHA');
  }
  return sha;
};

const getRepoIfExists = async (
  token: string,
  owner: string,
  repoName: string
): Promise<GitHubRepo | null> => {
  const response = await githubRequest(token, `/repos/${owner}/${repoName}`);
  if (response.status === 404) return null;
  await requireGitHubOk(response, [200], 'Failed to read repository');
  return (await response.json()) as GitHubRepo;
};

const ensureFork = async (
  token: string,
  username: string,
  targetOwner: string,
  targetRepoName: string
): Promise<GitHubRepo> => {
  const existingFork = await getRepoIfExists(token, username, targetRepoName);
  if (existingFork) {
    const parentFullName = existingFork.parent?.full_name;
    if (parentFullName && parentFullName !== `${targetOwner}/${targetRepoName}`) {
      throw new HttpError(
        409,
        `Your repository ${username}/${targetRepoName} is not a fork of ${targetOwner}/${targetRepoName}`
      );
    }
    return existingFork;
  }

  const createForkResponse = await githubRequest(token, `/repos/${targetOwner}/${targetRepoName}/forks`, {
    method: 'POST'
  });
  await requireGitHubOk(createForkResponse, [201, 202], 'Failed to create fork');

  const maxAttempts = 12;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const fork = await getRepoIfExists(token, username, targetRepoName);
    if (fork) {
      const parentFullName = fork.parent?.full_name;
      if (!parentFullName || parentFullName === `${targetOwner}/${targetRepoName}`) {
        return fork;
      }
    }

    await sleep(1200);
  }

  throw new HttpError(504, 'Fork creation timed out. Please retry in a few seconds.');
};

const createFeatureBranch = async (
  token: string,
  owner: string,
  repoName: string,
  branchName: string,
  baseSha: string
): Promise<void> => {
  const response = await githubRequest(token, `/repos/${owner}/${repoName}/git/refs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ref: `refs/heads/${branchName}`,
      sha: baseSha
    })
  });

  await requireGitHubOk(response, [201], 'Failed to create feature branch');
};

const createFeatureBranchWithRetry = async (
  token: string,
  owner: string,
  repoName: string,
  branchName: string,
  baseSha: string
): Promise<void> => {
  const maxAttempts = 6;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await createFeatureBranch(token, owner, repoName, branchName, baseSha);
      return;
    } catch (error) {
      const shouldRetry =
        error instanceof GitHubApiError &&
        (error.status === 404 || error.status === 422) &&
        attempt < maxAttempts;
      if (!shouldRetry) throw error;
      await sleep(900 * attempt);
    }
  }
};

const getBranchShaWithRetry = async (
  token: string,
  owner: string,
  repoName: string,
  branch: string
): Promise<string> => {
  const maxAttempts = 6;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await getBranchSha(token, owner, repoName, branch);
    } catch (error) {
      const shouldRetry =
        error instanceof GitHubApiError && error.status === 404 && attempt < maxAttempts;
      if (!shouldRetry) throw error;
      await sleep(900 * attempt);
    }
  }

  throw new GitHubApiError(504, 'Timed out while waiting for fork branch to become available');
};

const getFileShaOnBranch = async (
  token: string,
  owner: string,
  repoName: string,
  filePath: string,
  branch: string
): Promise<string | undefined> => {
  const encodedFilePath = encodePathSegments(filePath);
  const encodedBranch = encodeURIComponent(branch);
  const response = await githubRequest(
    token,
    `/repos/${owner}/${repoName}/contents/${encodedFilePath}?ref=${encodedBranch}`
  );

  if (response.status === 404) return undefined;
  await requireGitHubOk(response, [200], 'Failed to read file on branch');

  const payload = (await response.json()) as GitHubContentFile;
  return payload.sha;
};

const commitFileToBranch = async (
  token: string,
  owner: string,
  repoName: string,
  branch: string,
  filePath: string,
  content: string,
  commitMessage: string,
  existingSha?: string
): Promise<void> => {
  const encodedFilePath = encodePathSegments(filePath);
  const body = {
    message: commitMessage,
    content: toBase64(content),
    branch,
    ...(existingSha ? { sha: existingSha } : {})
  };

  const response = await githubRequest(token, `/repos/${owner}/${repoName}/contents/${encodedFilePath}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  await requireGitHubOk(response, [200, 201], 'Failed to commit markdown file');
};

const openPullRequest = async (
  token: string,
  targetOwner: string,
  targetRepoName: string,
  baseBranch: string,
  headRef: string,
  title: string,
  body?: string
): Promise<GitHubPullRequest> => {
  const response = await githubRequest(token, `/repos/${targetOwner}/${targetRepoName}/pulls`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title,
      head: headRef,
      base: baseBranch,
      ...(body ? { body } : {})
    })
  });

  await requireGitHubOk(response, [201], 'Failed to create pull request');
  return (await response.json()) as GitHubPullRequest;
};

const createPullRequest = async (
  token: string,
  payload: ContributionPayload
): Promise<CreatedPullRequestResult> => {
  const { owner: targetOwner, repoName: targetRepoName } = splitRepo(TARGET_REPO);
  const authenticatedUser = await fetchAuthenticatedUser(token);
  const username = authenticatedUser.login;
  if (!username) {
    throw new HttpError(401, 'Authenticated GitHub user is missing a login');
  }

  await ensureFork(token, username, targetOwner, targetRepoName);
  let baseSha: string;
  try {
    baseSha = await getBranchShaWithRetry(token, username, targetRepoName, payload.baseBranch);
  } catch (error) {
    const shouldFallbackToUpstream = error instanceof GitHubApiError && error.status === 404;
    if (!shouldFallbackToUpstream) throw error;
    baseSha = await getBranchSha(token, targetOwner, targetRepoName, payload.baseBranch);
  }

  const branchSeed = payload.filePath
    .replace(/^content\/posts\//, '')
    .replace(/\.md$/, '')
    .replace(/[^a-z0-9/\-]+/gi, '-')
    .replace(/\//g, '-');
  const branchName = normalizeBranchName(`openblog/${branchSeed}-${Date.now()}`);

  await createFeatureBranchWithRetry(token, username, targetRepoName, branchName, baseSha);

  const existingFileSha = await getFileShaOnBranch(
    token,
    username,
    targetRepoName,
    payload.filePath,
    branchName
  );

  await commitFileToBranch(
    token,
    username,
    targetRepoName,
    branchName,
    payload.filePath,
    payload.content,
    payload.commitMessage,
    existingFileSha
  );

  const pullRequest = await openPullRequest(
    token,
    targetOwner,
    targetRepoName,
    payload.baseBranch,
    `${username}:${branchName}`,
    payload.prTitle,
    payload.prBody
  );

  const pullRequestNumber = pullRequest.number;
  const pullRequestUrl = pullRequest.html_url;

  if (!pullRequestNumber || !pullRequestUrl) {
    throw new GitHubApiError(502, 'GitHub pull request response is incomplete');
  }

  return {
    filePath: payload.filePath,
    pullRequest: {
      number: pullRequestNumber,
      url: pullRequestUrl,
      headBranch: branchName,
      baseBranch: payload.baseBranch,
      forkRepo: `${GITHUB_UI_BASE}/${username}/${targetRepoName}`,
      targetRepo: `${GITHUB_UI_BASE}/${targetOwner}/${targetRepoName}`
    }
  };
};

const toErrorResponse = (error: unknown): { status: number; body: { error: string } } => {
  if (error instanceof HttpError) {
    return {
      status: error.status,
      body: { error: error.message }
    };
  }

  if (error instanceof GitHubApiError) {
    if (error.status === 401) {
      return {
        status: 401,
        body: { error: 'Invalid or expired GitHub session. Please sign in again.' }
      };
    }

    if (error.status === 403) {
      return {
        status: 403,
        body: {
          error:
            'GitHub denied this request. Re-authenticate and ensure public repo write permissions are granted.'
        }
      };
    }

    if (error.status >= 400 && error.status < 500) {
      return {
        status: 400,
        body: { error: error.message }
      };
    }

    return {
      status: 502,
      body: { error: error.message }
    };
  }

  return {
    status: 500,
    body: { error: 'Unexpected error while creating pull request' }
  };
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const cookies = parseCookies(request.headers.get('cookie'));
    const corsHeaders = getCorsHeaders(request, env);
    const missingAuthEnv = validateAuthEnv(env);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          ...corsHeaders,
          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }

    if (url.pathname === '/login') {
      if (missingAuthEnv.length > 0) {
        console.error('OAuth config missing', { missing: missingAuthEnv });
        return json(
          {
            error: 'OAuth not configured on Worker',
            missing: missingAuthEnv
          },
          500,
          corsHeaders
        );
      }

      const state = generateState();
      const redirectUrl = buildAuthorizeUrl(request, env, state);
      const returnTo = sanitizeReturnTo(url.searchParams.get('return_to'), request, env);
      const headers = new Headers({
        Location: redirectUrl
      });

      headers.append(
        'Set-Cookie',
        createCookie(COOKIE_NAMES.state, state, {
          maxAge: STATE_TTL_SECONDS,
          httpOnly: true,
          sameSite: 'Lax',
          secure: true
        })
      );

      if (returnTo) {
        headers.append(
          'Set-Cookie',
          createCookie(COOKIE_NAMES.returnTo, returnTo, {
            maxAge: STATE_TTL_SECONDS,
            httpOnly: true,
            sameSite: 'Lax',
            secure: true
          })
        );
      } else {
        headers.append(
          'Set-Cookie',
          createCookie(COOKIE_NAMES.returnTo, '', {
            maxAge: 0,
            httpOnly: true,
            sameSite: 'Lax',
            secure: true
          })
        );
      }

      return new Response(null, {
        status: 302,
        headers
      });
    }

    if (url.pathname === '/callback') {
      if (missingAuthEnv.length > 0) {
        console.error('OAuth config missing', { missing: missingAuthEnv });
        return json(
          {
            error: 'OAuth not configured on Worker',
            missing: missingAuthEnv
          },
          500,
          corsHeaders
        );
      }

      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const storedState = cookies[COOKIE_NAMES.state];
      const returnTo = sanitizeReturnTo(cookies[COOKIE_NAMES.returnTo] ?? null, request, env);

      if (!code || !state) {
        return json({ error: 'Missing code or state' }, 400, corsHeaders);
      }

      if (!storedState || state !== storedState) {
        return json({ error: 'Invalid OAuth state' }, 400, corsHeaders);
      }

      try {
        const token = await exchangeCodeForToken(code, request, env);
        const headers = new Headers({
          'cache-control': 'no-store',
          Location: returnTo ?? `${getBaseUrl(request)}/`,
          ...corsHeaders
        });
        headers.append(
          'Set-Cookie',
          createCookie(COOKIE_NAMES.token, token, {
            maxAge: TOKEN_TTL_SECONDS,
            httpOnly: true,
            sameSite: getTokenCookieSameSite(env),
            secure: true
          })
        );
        headers.append(
          'Set-Cookie',
          createCookie(COOKIE_NAMES.state, '', {
            maxAge: 0,
            httpOnly: true,
            sameSite: 'Lax',
            secure: true
          })
        );
        headers.append(
          'Set-Cookie',
          createCookie(COOKIE_NAMES.returnTo, '', {
            maxAge: 0,
            httpOnly: true,
            sameSite: 'Lax',
            secure: true
          })
        );

        return new Response(null, { status: 302, headers });
      } catch (error) {
        console.error('OAuth callback failed', error);
        return json({ error: (error as Error).message }, 500, corsHeaders);
      }
    }

    if (url.pathname === '/me') {
      const token = cookies[COOKIE_NAMES.token];
      if (!token) {
        return json({ error: 'Not authenticated' }, 401, corsHeaders);
      }

      try {
        const user = await fetchAuthenticatedUser(token);
        return json(user, 200, corsHeaders);
      } catch (error) {
        console.error('Failed to fetch authenticated user', error);
        return json({ error: 'Invalid or expired token' }, 401, {
          ...corsHeaders,
          'Set-Cookie': createCookie(COOKIE_NAMES.token, '', {
            maxAge: 0,
            httpOnly: true,
            sameSite: getTokenCookieSameSite(env),
            secure: true
          })
        });
      }
    }

    if (url.pathname === '/contribute') {
      if (request.method !== 'POST') {
        return json({ error: 'Method Not Allowed' }, 405, corsHeaders);
      }

      const token = cookies[COOKIE_NAMES.token];
      if (!token) {
        return json({ error: 'Not authenticated' }, 401, corsHeaders);
      }

      if (missingAuthEnv.length > 0) {
        return json(
          {
            error: 'OAuth not configured on Worker',
            missing: missingAuthEnv
          },
          500,
          corsHeaders
        );
      }

      try {
        assertStateChangingOrigin(request, env);
        const payload = await parseContributionPayload(request);
        const result = await createPullRequest(token, payload);
        return json(result, 201, corsHeaders);
      } catch (error) {
        console.error('Failed to create contribution pull request', error);

        const mapped = toErrorResponse(error);
        const shouldClearCookie = mapped.status === 401;
        if (shouldClearCookie) {
          return json(mapped.body, mapped.status, {
            ...corsHeaders,
            'Set-Cookie': createCookie(COOKIE_NAMES.token, '', {
              maxAge: 0,
              httpOnly: true,
              sameSite: getTokenCookieSameSite(env),
              secure: true
            })
          });
        }

        return json(mapped.body, mapped.status, corsHeaders);
      }
    }

    if (url.pathname === '/logout') {
      if (request.method !== 'POST') {
        return json({ error: 'Method Not Allowed' }, 405, corsHeaders);
      }

      return new Response(null, {
        status: 204,
        headers: {
          ...corsHeaders,
          'Set-Cookie': createCookie(COOKIE_NAMES.token, '', {
            maxAge: 0,
            httpOnly: true,
            sameSite: getTokenCookieSameSite(env),
            secure: true
          })
        }
      });
    }

    return json({ error: 'Not Found' }, 404, corsHeaders);
  }
};

export { createPullRequest };
