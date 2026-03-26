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

const COOKIE_NAMES = {
  token: 'gh_token',
  state: 'oauth_state',
  returnTo: 'oauth_return_to'
} as const;

const STATE_TTL_SECONDS = 600;
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

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

const getAllowedCorsOrigin = (request: Request, env: Env): string | null => {
  const requestOrigin = normalizeOrigin(request.headers.get('origin'));
  if (!requestOrigin) return null;

  const allowedOrigin = normalizeOrigin(env.AUTH_ALLOWED_ORIGIN);
  if (allowedOrigin) {
    return requestOrigin === allowedOrigin ? requestOrigin : null;
  }

  const workerOrigin = getBaseUrl(request);
  return requestOrigin === workerOrigin ? requestOrigin : null;
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

  const allowedOrigin = normalizeOrigin(env.AUTH_ALLOWED_ORIGIN) ?? getBaseUrl(request);
  if (parsed.origin !== allowedOrigin) {
    return null;
  }

  return parsed.toString();
};

const buildAuthorizeUrl = (request: Request, env: Env, state: string): string => {
  const callbackUrl = `${getBaseUrl(request)}/callback`;
  const authorizeUrl = new URL('https://github.com/login/oauth/authorize');

  authorizeUrl.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
  authorizeUrl.searchParams.set('redirect_uri', callbackUrl);
  authorizeUrl.searchParams.set('scope', 'read:user');
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

const fetchAuthenticatedUser = async (token: string): Promise<GitHubUser> => {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'openblog-github-auth-worker'
    }
  });

  if (!response.ok) {
    throw new Error(`GitHub /user failed with status ${response.status}`);
  }

  return (await response.json()) as GitHubUser;
};

const createPullRequest = async (
  token: string,
  repo: string,
  branch: string,
  filePath: string,
  content: string
): Promise<unknown> => {
  const [owner, repoName] = repo.split('/');
  if (!owner || !repoName) {
    throw new Error('repo must be in "owner/repo" format');
  }

  const refResponse = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/ref/heads/${branch}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'openblog-github-auth-worker'
    }
  });

  if (!refResponse.ok) {
    throw new Error(`Unable to read branch ref: ${refResponse.status}`);
  }

  const refData = (await refResponse.json()) as { object: { sha: string } };
  const baseSha = refData.object.sha;
  const featureBranch = `openblog-auth-${Date.now()}`;

  await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/refs`, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'openblog-github-auth-worker'
    },
    body: JSON.stringify({
      ref: `refs/heads/${featureBranch}`,
      sha: baseSha
    })
  });

  await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/${filePath}`, {
    method: 'PUT',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'openblog-github-auth-worker'
    },
    body: JSON.stringify({
      message: `chore: update ${filePath}`,
      content: btoa(unescape(encodeURIComponent(content))),
      branch: featureBranch
    })
  });

  const prResponse = await fetch(`https://api.github.com/repos/${owner}/${repoName}/pulls`, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'openblog-github-auth-worker'
    },
    body: JSON.stringify({
      title: `Update ${filePath}`,
      head: featureBranch,
      base: branch,
      body: 'Automated change from Cloudflare Worker.'
    })
  });

  if (!prResponse.ok) {
    throw new Error(`Failed to create pull request: ${prResponse.status}`);
  }

  return prResponse.json();
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const cookies = parseCookies(request.headers.get('cookie'));
    const corsHeaders = getCorsHeaders(request, env);

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
          Location: returnTo ?? `${getBaseUrl(request)}/github-auth`,
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

    if (url.pathname === '/logout') {
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
