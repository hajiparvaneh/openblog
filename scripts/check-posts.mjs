import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { validateContentPages, validatePostEntries } from '../src/lib/post-model.mjs';

const root = process.cwd();
const postsDir = path.join(root, 'content', 'posts');
const pagesDir = path.join(root, 'content', 'pages');
const errors = [];

function relative(filePath) {
  return path.relative(root, filePath).replace(/\\/g, '/');
}

function readMarkdown(filePath) {
  return matter(fs.readFileSync(filePath, 'utf8'));
}

const postEntries = [];

if (!fs.existsSync(postsDir)) {
  errors.push('content/posts is missing.');
} else {
  for (const categoryName of fs.readdirSync(postsDir, { withFileTypes: true })) {
    if (categoryName.name.startsWith('.')) continue;
    const categoryPath = path.join(postsDir, categoryName.name);
    if (!categoryName.isDirectory()) {
      errors.push(`${relative(categoryPath)}: posts must live in a category folder.`);
      continue;
    }

    for (const entry of fs.readdirSync(categoryPath, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue;
      const entryPath = path.join(categoryPath, entry.name);
      if (entry.isDirectory()) {
        errors.push(`${relative(entryPath)}: nested folders are not supported. Keep posts one folder deep.`);
        continue;
      }
      if (!entry.name.endsWith('.md')) continue;
      const parsed = readMarkdown(entryPath);
      postEntries.push({
        slug: `${categoryName.name}/${entry.name.replace(/\.md$/i, '')}`,
        data: parsed.data,
        filePath: relative(entryPath)
      });
    }
  }
}

errors.push(...validatePostEntries(postEntries));

const pageEntries = [];
if (fs.existsSync(pagesDir)) {
  for (const entry of fs.readdirSync(pagesDir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || !entry.name.endsWith('.md')) continue;
    const entryPath = path.join(pagesDir, entry.name);
    if (!entry.isFile()) continue;
    const parsed = readMarkdown(entryPath);
    pageEntries.push({
      slug: entry.name.replace(/\.md$/i, ''),
      data: parsed.data,
      filePath: relative(entryPath)
    });
  }
}

errors.push(...validateContentPages(pageEntries));

if (errors.length > 0) {
  console.error(`Post check failed (${errors.length}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Checked ${postEntries.length} post files and ${pageEntries.length} extra pages.`);
