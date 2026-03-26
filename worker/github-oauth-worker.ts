interface Env {
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
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
  state: 'oauth_state'
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

    if (url.pathname === '/login') {
      const state = generateState();
      const redirectUrl = buildAuthorizeUrl(request, env, state);

      return new Response(null, {
        status: 302,
        headers: {
          Location: redirectUrl,
          'Set-Cookie': createCookie(COOKIE_NAMES.state, state, {
            maxAge: STATE_TTL_SECONDS,
            httpOnly: true,
            sameSite: 'Lax',
            secure: true
          })
        }
      });
    }

    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const storedState = cookies[COOKIE_NAMES.state];

      if (!code || !state) {
        return json({ error: 'Missing code or state' }, 400);
      }

      if (!storedState || state !== storedState) {
        return json({ error: 'Invalid OAuth state' }, 400);
      }

      try {
        const token = await exchangeCodeForToken(code, request, env);
        const user = await fetchAuthenticatedUser(token);
        const headers = new Headers({
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'no-store'
        });
        headers.append(
          'Set-Cookie',
          createCookie(COOKIE_NAMES.token, token, {
            maxAge: TOKEN_TTL_SECONDS,
            httpOnly: true,
            sameSite: 'Lax',
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

        return new Response(JSON.stringify(user), { status: 200, headers });
      } catch (error) {
        return json({ error: (error as Error).message }, 500);
      }
    }

    if (url.pathname === '/me') {
      const token = cookies[COOKIE_NAMES.token];
      if (!token) {
        return json({ error: 'Not authenticated' }, 401);
      }

      try {
        const user = await fetchAuthenticatedUser(token);
        return json(user);
      } catch {
        return json({ error: 'Invalid or expired token' }, 401, {
          'Set-Cookie': createCookie(COOKIE_NAMES.token, '', {
            maxAge: 0,
            httpOnly: true,
            sameSite: 'Lax',
            secure: true
          })
        });
      }
    }

    if (url.pathname === '/logout') {
      return new Response(null, {
        status: 204,
        headers: {
          'Set-Cookie': createCookie(COOKIE_NAMES.token, '', {
            maxAge: 0,
            httpOnly: true,
            sameSite: 'Lax',
            secure: true
          })
        }
      });
    }

    return json({ error: 'Not Found' }, 404);
  }
};

export { createPullRequest };
