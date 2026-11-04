import { Marked, type Token, type Tokens } from 'marked';
import { createHighlighter, type BundledLanguage, type Highlighter } from 'shiki';
import { withBase } from './paths';

export type TocItem = {
  id: string;
  text: string;
  depth: 2 | 3;
};

const LANGS: BundledLanguage[] = [
  'javascript',
  'typescript',
  'tsx',
  'jsx',
  'json',
  'bash',
  'html',
  'css',
  'markdown',
  'yaml',
  'xml',
  'python',
  'go',
  'rust',
  'sql',
  'diff'
];

const LANG_ALIAS: Record<string, string> = {
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  yml: 'yaml',
  text: 'plaintext',
  txt: 'plaintext',
  md: 'markdown',
  js: 'javascript',
  ts: 'typescript'
};

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-light', 'github-dark'],
      langs: LANGS
    });
  }
  return highlighterPromise;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function plainHeading(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[`*_~]+/g, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

export function headingId(text: string, used: Map<string, number>): string {
  const base =
    plainHeading(text)
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
      .replace(/^-+|-+$/g, '') || 'section';
  const count = used.get(base) ?? 0;
  used.set(base, count + 1);
  return count === 0 ? base : `${base}-${count + 1}`;
}

function rewriteRootUrls(html: string): string {
  return html.replace(/(\s(?:href|src)=["'])(\/(?!\/)[^"']*)/g, (_match, attr: string, path: string) => {
    return `${attr}${withBase(path)}`;
  });
}

function resolveLang(highlighter: Highlighter, lang: string | undefined): BundledLanguage | undefined {
  const requested = (lang ?? '').trim().toLowerCase();
  const mapped = LANG_ALIAS[requested] ?? requested;
  if (mapped && highlighter.getLoadedLanguages().includes(mapped)) return mapped as BundledLanguage;
  return undefined;
}

function plainCode(text: string): string {
  return `<pre class="shiki shiki-plain"><code>${escapeHtml(text)}</code></pre>`;
}

export async function renderMarkdown(source: string): Promise<{ html: string; toc: TocItem[] }> {
  const highlighter = await getHighlighter();
  const marked = new Marked({ gfm: true });
  const tokens = marked.lexer(source);
  const toc: TocItem[] = [];
  const used = new Map<string, number>();
  const ids = new WeakMap<Token, string>();

  for (const token of tokens) {
    if (token.type !== 'heading') continue;
    const heading = token as Tokens.Heading;
    if (heading.depth !== 2 && heading.depth !== 3) continue;
    const id = headingId(heading.text, used);
    ids.set(heading, id);
    toc.push({ id, text: plainHeading(heading.text), depth: heading.depth });
  }

  marked.use({
    renderer: {
      heading(token) {
        const text = this.parser.parseInline(token.tokens);
        const id = ids.get(token);
        if (!id) return `<h${token.depth}>${text}</h${token.depth}>\n`;
        return `<h${token.depth} id="${escapeHtml(id)}">${text}</h${token.depth}>\n`;
      },
      code(token) {
        const language = resolveLang(highlighter, token.lang);
        if (!language) return plainCode(token.text);
        return highlighter.codeToHtml(token.text, {
          lang: language,
          themes: {
            light: 'github-light',
            dark: 'github-dark'
          },
          defaultColor: false
        });
      }
    }
  });

  return { html: rewriteRootUrls(marked.parser(tokens)), toc };
}
