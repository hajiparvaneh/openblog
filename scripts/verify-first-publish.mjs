/**
 * OPB-6: Simulate a fresh-repo first-publish path from the quickstart only.
 * Times branding → first Markdown post → static build with GitHub Pages base path.
 */
import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const startedAt = Date.now();
const steps = [];

function mark(label, since) {
  const ms = Date.now() - since;
  steps.push({ label, ms });
  return Date.now();
}

const fixture = await mkdtemp(path.join(tmpdir(), 'openblog-first-publish-'));
const blockers = [];

try {
  let t = Date.now();

  // Fresh repo shape: starter sources only — no worker, no openblog/ events, no .env.
  for (const name of ['src', 'public', 'astro.config.mjs', 'openblog.config.ts', 'package.json', 'tsconfig.json']) {
    await cp(path.join(root, name), path.join(fixture, name), { recursive: true });
  }
  await mkdir(path.join(fixture, 'content/posts/notes'), { recursive: true });
  await cp(path.join(root, 'content/about.md'), path.join(fixture, 'content/about.md'));
  await symlink(path.join(root, 'node_modules'), path.join(fixture, 'node_modules'), 'dir');
  t = mark('Scaffold fresh repo (copy starter files)', t);

  // Quickstart: configure branding without editing layouts.
  let config = await readFile(path.join(fixture, 'openblog.config.ts'), 'utf8');
  config = config
    .replace("title: 'OpenBlog'", "title: 'Nova Notes'")
    .replace("description:\n    'A Markdown blog you can brand, write, and publish from GitHub — no credentials required to build.'", "description: 'A personal notes blog branded in under a minute.'")
    .replace("accentColor: '#0969da'", "accentColor: '#0f766e'");
  await writeFile(path.join(fixture, 'openblog.config.ts'), config);
  await writeFile(
    path.join(fixture, 'content/about.md'),
    '# About Nova Notes\n\nBranded from the OpenBlog quickstart.\n'
  );
  t = mark('Configure branding (openblog.config.ts + about.md)', t);

  // Quickstart: write first Markdown post.
  await writeFile(
    path.join(fixture, 'content/posts/notes/hello-from-quickstart.md'),
    `---
title: Hello from the quickstart
description: First post published after branding a fresh OpenBlog starter repo.
date: 2026-11-03
tags: [quickstart]
---

## Published locally

This post was added by following only the README quickstart steps.
`
  );
  t = mark('Write first Markdown post', t);

  // Quickstart: build for GitHub project Pages (origin + base path).
  const build = spawnSync(process.execPath, [path.join(root, 'node_modules/astro/bin/astro.mjs'), 'build'], {
    cwd: fixture,
    env: {
      PATH: process.env.PATH,
      OPENBLOG_BASE_URL: 'https://example.github.io/',
      OPENBLOG_BASE_PATH: '/nova-notes',
      ASTRO_TELEMETRY_DISABLED: '1'
    },
    encoding: 'utf8'
  });
  if (build.status !== 0) {
    blockers.push('Build failed without credentials — see stdout/stderr from verify-first-publish.');
  }
  assert.equal(build.status, 0, `${build.stdout}\n${build.stderr}`);
  t = mark('Build static site for GitHub Pages base path', t);

  const dist = path.join(fixture, 'dist');
  const home = await readFile(path.join(dist, 'index.html'), 'utf8');
  const post = await readFile(path.join(dist, 'posts/notes/hello-from-quickstart/index.html'), 'utf8');
  const about = await readFile(path.join(dist, 'about/index.html'), 'utf8');

  assert.match(home, /Nova Notes/);
  assert.match(home, /Hello from the quickstart/);
  assert.match(home, /href="\/nova-notes\/about"/);
  assert.match(post, /Published locally/);
  assert.match(post, /https:\/\/example\.github\.io\/nova-notes\/posts\/notes\/hello-from-quickstart/);
  assert.match(about, /Branded from the OpenBlog quickstart/);
  assert.doesNotMatch(home, /\/leaderboard|\/contribute|header-auth/);
  t = mark('Verify branding, post URL, About, and no community routes', t);

  const totalMs = Date.now() - startedAt;
  const underTenMinutes = totalMs < 10 * 60 * 1000;

  if (!underTenMinutes) {
    blockers.push(`Timed path exceeded 10 minutes (${(totalMs / 1000).toFixed(1)}s).`);
  }

  // Human steps not automated here (GitHub UI): Use this template, enable Pages, open/merge PR.
  const manualRemaining = [
    'GitHub → Use this template (requires Template repository enabled on upstream)',
    'Settings → Pages → Source: GitHub Actions',
    'Open PR with Markdown change → merge to main → wait for Pages deploy',
    'Share public URL https://<user>.github.io/<repo>/posts/...'
  ];

  const report = `# First-publish validation (OPB-6)

Generated: ${new Date().toISOString()}

## Result

- **Automated quickstart path:** ${underTenMinutes && blockers.length === 0 ? 'PASS' : 'FAIL'}
- **Total automated time:** ${(totalMs / 1000).toFixed(1)}s (target &lt; 10 minutes)
- **Credentials required:** none
- **Public URL shape verified:** \`https://example.github.io/nova-notes/posts/notes/hello-from-quickstart\`

## Timed steps

| Step | Time |
| --- | --- |
${steps.map((step) => `| ${step.label} | ${(step.ms / 1000).toFixed(2)}s |`).join('\n')}
| **Total** | **${(totalMs / 1000).toFixed(2)}s** |

## Checks

- [x] Brand via \`openblog.config.ts\` + \`content/about.md\` (no layout edits)
- [x] Add Markdown post under \`content/posts/\`
- [x] \`npm run build\` with Pages base path, no secrets / Worker / scoring data
- [x] Rendered home shows custom title + new post
- [x] Canonical post URL includes project base path
- [x] Community routes absent from starter output

## Remaining manual steps (second developer)

These need a GitHub account and cannot be finished in CI alone:

${manualRemaining.map((item) => `- [ ] ${item}`).join('\n')}

## Blockers

${blockers.length === 0 ? '_None found in the automated path._' : blockers.map((b) => `- ${b}`).join('\n')}

## Notes for a second developer

1. Follow only the **Quickstart** section in \`README.md\`.
2. Do not set \`OPENBLOG_COMMUNITY\`.
3. Stop the clock when the Pages URL loads the merged post.
4. File any friction as blockers above or in OPB-6 comments.
`;

  await mkdir(path.join(root, 'docs'), { recursive: true });
  await writeFile(path.join(root, 'docs/FIRST-PUBLISH-VALIDATION.md'), report);
  console.log(report);
  console.log(`\nWrote docs/FIRST-PUBLISH-VALIDATION.md (${(totalMs / 1000).toFixed(1)}s)`);
} finally {
  await rm(fixture, { recursive: true, force: true });
}
