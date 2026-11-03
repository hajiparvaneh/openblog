import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const fixture = await mkdtemp(path.join(tmpdir(), 'openblog-standalone-'));
try {
  // Deliberately omit .env, worker/, and openblog/ (events, enums and generated data).
  for (const name of ['src', 'public', 'astro.config.mjs', 'package.json', 'tsconfig.json']) {
    await cp(path.join(root, name), path.join(fixture, name), { recursive: true });
  }
  await symlink(path.join(root, 'node_modules'), path.join(fixture, 'node_modules'), 'dir');
  const postsDir = path.join(fixture, 'content/posts/testing');
  await mkdir(postsDir, { recursive: true });
  await writeFile(path.join(postsDir, 'first.md'), `---
title: First standalone post
description: A credential-free sample.
date: 2026-01-01
tags: [Static]
thumbnail: /favicon-32x32.png
---

## Fixture heading

Standalone **Markdown** body.
`);
  await writeFile(path.join(postsDir, 'second.md'), `---
title: Second standalone post
date: 2026-01-02
---

Second published body.
`);
  await writeFile(path.join(postsDir, 'draft.md'), `---
title: Unpublished fixture secret
draft: true
---

Do not publish this draft.
`);
  const result = spawnSync(process.execPath, [path.join(root, 'node_modules/astro/bin/astro.mjs'), 'build'], {
    cwd: fixture,
    // Explicitly allow only these environment values: no inherited credentials or Worker URL.
    env: { PATH: process.env.PATH, OPENBLOG_BASE_URL: 'https://example.test/', ASTRO_TELEMETRY_DISABLED: '1' },
    encoding: 'utf8'
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  const output = path.join(fixture, 'dist');
  const home = await readFile(path.join(output, 'index.html'), 'utf8');
  assert.match(home, /First standalone post/);
  assert.match(home, /Second standalone post/);
  assert.doesNotMatch(home, /Unpublished fixture secret/);
  const post = await readFile(path.join(output, 'posts/testing/first/index.html'), 'utf8');
  assert.match(post, /<strong>Markdown<\/strong>/);
  assert.match(post, /Fixture heading/);
  assert.match(post, /src="\/favicon-32x32.png"/);
  assert.match(post, /https:\/\/example.test\/posts\/testing\/first/);
  assert.match(await readFile(path.join(output, 'categories/testing/index.html'), 'utf8'), /Second standalone post/);
  assert.match(await readFile(path.join(output, 'tag/static/index.html'), 'utf8'), /First standalone post/);
  const files = await readdir(output, { recursive: true });
  assert(!files.some(file => /^(leaderboard|contribute|profile|@)/.test(file)), 'Community routes must be absent');
  for (const file of files.filter(file => /\.(html|xml|txt)$/.test(file))) {
    const body = await readFile(path.join(output, file), 'utf8');
    assert.doesNotMatch(body, /Unpublished fixture secret|\/leaderboard|\/contribute|\/profile|header-auth|histats\.com|\/login|\/logout/);
    assert(!file.includes('draft'), 'Draft route must be absent');
  }
  const sitemap = await readFile(path.join(output, 'sitemap.xml'), 'utf8');
  assert.match(sitemap, /https:\/\/example.test\/posts\/testing\/second/);
  assert.match(sitemap, /https:\/\/example.test\/tag\/static/);
  assert.match(await readFile(path.join(output, 'robots.txt'), 'utf8'), /Sitemap: https:\/\/example.test\/sitemap.xml/);
  console.log('Standalone fixture passed: two posts, Markdown, images, categories, tags, drafts, SEO, and no community routes or credentials.');
} finally {
  await rm(fixture, { recursive: true, force: true });
}
