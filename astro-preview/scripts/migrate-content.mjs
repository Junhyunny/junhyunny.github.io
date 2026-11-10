#!/usr/bin/env node
// Jekyll 원본(_posts, _logs, _books)을 Astro 콘텐츠 컬렉션 형식으로 변환한다.
// 원본은 읽기만 하고, 같은 입력에 대해 항상 같은 결과를 만든다.
//
//   node scripts/migrate-content.mjs [--check]
//
// --check: 파일을 쓰지 않고 현재 출력이 최신인지 확인한다.
import { createHash } from 'node:crypto';
import { mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfmFromMarkdown } from 'mdast-util-gfm';
import { toString } from 'mdast-util-to-string';
import { gfm } from 'micromark-extension-gfm';
import { bundledLanguages } from 'shiki';
import { visit } from 'unist-util-visit';
import { parse as parseYaml } from 'yaml';

const here = path.dirname(fileURLToPath(import.meta.url));
const project = path.resolve(here, '..');
const source = path.resolve(project, '..');
const migrationDir = path.join(project, 'migration');
const contentDir = path.join(project, 'src/content');
const liveSite = 'https://junhyunny.github.io';
const checkOnly = process.argv.includes('--check');

const kinds = [
  { kind: 'post', collection: 'posts', dir: '_posts' },
  { kind: 'log', collection: 'logs', dir: '_logs' },
  { kind: 'book', collection: 'books', dir: '_books' },
];

const config = parseYaml(readFileSync(path.join(source, '_config.yml'), 'utf8'));
const imageVariable = /\{\{\s*site\.(image_url_20\d{2})\s*\}\}/g;
const codepenInclude = /^\{% include codepen\.html hash="([A-Za-z0-9]+)" tab="([a-z,]+)" title="([^"]+)" %\}$/;
const recommendHeading = /^RECOMMEND (POSTS BEFORE THIS|NEXT(?: POSTS)?)$/;
const liquidLike = /\{\{[\s\S]*?\}\}|\{%[\s\S]*?%\}/g;
const spacedLiquid = /\{ \{|\} \}|\{ %|% \}/g;
const overrides = JSON.parse(readFileSync(path.join(migrationDir, 'overrides.json'), 'utf8'));
const shikiLanguages = new Set([...Object.keys(bundledLanguages), 'text', 'txt', 'plain', 'plaintext']);

const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const quote = (value) => JSON.stringify(value);

function listMarkdown(dir) {
  return readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return listMarkdown(full);
      return entry.name.endsWith('.md') ? [full] : [];
    })
    .sort();
}

function splitFrontmatter(text, file) {
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(text);
  if (!match) throw new Error(`${file}: frontmatter를 찾을 수 없습니다.`);
  return { data: parseYaml(match[1]) ?? {}, body: text.slice(match[0].length), bodyLine: match[0].split('\n').length };
}

// Jekyll 3의 UrlDrop#categories와 같은 규칙: 소문자로 바꾸고 순서를 유지한 채 중복을 제거한다.
function jekyllCategoryPath(categories) {
  return [...new Set(categories.map((category) => String(category).toLowerCase()))].join('/');
}

// 운영 사이트(GitHub Pages)는 시간대 설정이 없어 시간대가 없는 값을 UTC로 출력한다.
function normalizeTimestamp(value, file) {
  const text = value instanceof Date ? value.toISOString() : String(value);
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:[+-]\d{2}:\d{2}|Z)$/.test(text)) return text;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(text)) return `${text}+00:00`;
  throw new Error(`${file}: 알 수 없는 last_modified_at 형식 ${text}`);
}

const isLineBreak = (node) => node?.type === 'html' && /^<br\s*\/?>\s*$/i.test(node.value);

// HTML 조각이 하나의 요소로 시작해서 그 요소로 끝나는지 (<div>…</div>, <p>…</p>)
function isSingleElement(html) {
  const tag = /^<([a-z][a-z0-9]*)\b/i.exec(html)?.[1];
  if (!tag) return false;
  let depth = 0;
  for (const match of html.matchAll(new RegExp(`<(/?)${tag}\\b[^>]*?(/?)>`, 'gi'))) {
    if (match[2]) continue;
    depth += match[1] ? -1 : 1;
    if (depth === 0) return match.index + match[0].length === html.trimEnd().length;
  }
  return false;
}

function parseMarkdown(body) {
  return fromMarkdown(body, { extensions: [gfm()], mdastExtensions: [gfmFromMarkdown()] });
}

function convert({ kind, file, text }) {
  // overrides.json·manifest·보고서의 키로 쓰므로 Windows에서도 / 구분자로 맞춘다.
  const relative = path.relative(source, file).split(path.sep).join('/');
  const report = [];
  const note = (type, line, detail) => report.push({ type, file: relative, line, detail });
  const normalized = text.replace(/\r\n/g, '\n');
  // 줄바꿈은 체크아웃 설정(core.autocrlf)에 따라 달라지므로 LF로 맞춘 내용을 기준으로 변환하고 해시를 계산한다.

  const { data, body, bodyLine } = splitFrontmatter(normalized, relative);
  const lineOf = (offset) => bodyLine + body.slice(0, offset).split('\n').length - 1;
  const basename = path.basename(file, '.md');
  const dateMatch = /^(\d{4}-\d{2}-\d{2})-(.+)$/.exec(basename);
  if (!dateMatch) throw new Error(`${relative}: 파일명에서 날짜를 찾을 수 없습니다.`);
  const [, publishedAt, slug] = dateMatch;
  if (!/^[A-Za-z0-9._-]+$/.test(slug)) throw new Error(`${relative}: 슬러그 규칙을 확인해야 합니다 (${slug}).`);

  const categories = Array.isArray(data.category) ? data.category.map(String) : data.category ? [String(data.category)] : [];
  if (categories.length === 0) throw new Error(`${relative}: category가 없습니다.`);
  if (typeof data.title !== 'string' || !data.title) throw new Error(`${relative}: title이 없습니다.`);

  const collectionPath = path.relative(path.join(source, `_${kind}s`), file).split(path.sep).join('/').replace(/\.md$/, '');
  const canonicalPath = kind === 'post'
    ? `/${jekyllCategoryPath(categories)}/${slug}/`
    : `/${kind}s/${collectionPath}/`;

  const tree = parseMarkdown(body);
  const codeRanges = [];
  visit(tree, ['code', 'inlineCode'], (node) => {
    codeRanges.push([node.position.start.offset, node.position.end.offset]);
    if (node.type === 'code') {
      const lang = node.lang?.toLowerCase();
      if (lang && !shikiLanguages.has(lang)) note('code-language', node.position.start.line + bodyLine - 1, `지원하지 않는 코드 언어 표기 \`${node.lang}\`는 일반 텍스트로 표시됩니다.`);
    }
  });
  const inCode = (offset) => codeRanges.some(([start, end]) => offset >= start && offset < end);
  const edits = [];

  // 1. Liquid 이미지 변수 → 원래 이미지 저장소 주소
  for (const match of body.matchAll(imageVariable)) {
    if (inCode(match.index)) {
      note('liquid-in-code', lineOf(match.index), `코드 안의 \`${match[0]}\`는 원문 그대로 둡니다.`);
      continue;
    }
    const url = config[match[1]];
    if (!url) throw new Error(`${relative}:${lineOf(match.index)} _config.yml에 ${match[1]}이 없습니다.`);
    edits.push({ start: match.index, end: match.index + match[0].length, text: url });
  }

  // 2. CodePen include → 삽입 iframe과 원본 링크
  visit(tree, 'paragraph', (node) => {
    const { start, end } = node.position;
    const match = codepenInclude.exec(body.slice(start.offset, end.offset));
    if (!match) return;
    const [, hash, tab, title] = match;
    const escaped = title.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
    edits.push({
      start: start.offset,
      end: end.offset,
      text: `<iframe class="codepen" src="https://codepen.io/${config.codepen_username}/embed/${hash}?default-tab=${tab}" title="${escaped}" loading="lazy" allowfullscreen></iframe>\n<p><a href="https://codepen.io/${config.codepen_username}/pen/${hash}/">CodePen에서 예제 열기</a></p>`,
    });
  });

  // 3. 읽기 전·후 추천 글 → recommendedPosts
  const definitions = new Map();
  visit(tree, 'definition', (node) => { definitions.set(node.identifier, node); });
  const children = tree.children;
  const sections = { before: [], next: [] };
  const consumedReferences = new Set();
  const removedRanges = [];
  for (let index = 0; index < children.length; index += 1) {
    const heading = children[index];
    if (heading.type !== 'heading') continue;
    const label = toString(heading).trim().replace(/\s+/g, ' ').toUpperCase();
    const which = recommendHeading.exec(label);
    if (!which) continue;
    const key = which[1] === 'POSTS BEFORE THIS' ? 'before' : 'next';
    let end = index + 1;
    while (end < children.length && children[end].type !== 'heading') end += 1;
    const content = children.slice(index + 1, end);
    const blocks = content.filter((node) => node.type !== 'definition');
    const nextStart = (node) => {
      const position = children.indexOf(node) + 1;
      return position < children.length ? children[position].position.start.offset : body.length;
    };
    const line = heading.position.start.line + bodyLine - 1;

    if (blocks.length === 0) {
      edits.push({ start: heading.position.start.offset, end: nextStart(heading), text: '' });
      note('recommend-empty', line, `빈 \`${label}\` 섹션을 제거했습니다.`);
      continue;
    }
    const [list] = blocks;
    const links = [];
    const references = [];
    let problem = blocks.length !== 1 || list.type !== 'list' ? '목록 하나로 이루어지지 않았습니다.' : undefined;
    for (const item of problem ? [] : list.children) {
      const [paragraph] = item.children;
      const inline = paragraph?.type === 'paragraph'
        ? paragraph.children.filter((node) => !(node.type === 'text' && !node.value.trim()))
        : [];
      const [link] = inline;
      if (item.children.length !== 1 || inline.length !== 1 || !['link', 'linkReference'].includes(link.type)) {
        problem = `${item.position.start.line + bodyLine - 1}행 항목이 링크 하나로 이루어지지 않았습니다.`;
        break;
      }
      const href = link.type === 'link' ? link.url : definitions.get(link.identifier)?.url;
      if (!href) {
        problem = `${item.position.start.line + bodyLine - 1}행 링크 정의를 찾을 수 없습니다.`;
        break;
      }
      if (link.type === 'linkReference') references.push(link);
      links.push({ title: toString(link).trim(), href });
    }
    if (problem) {
      note('recommend-kept', line, `\`${label}\` 섹션을 원문에 남겼습니다: ${problem}`);
      continue;
    }
    sections[key].push(...links);
    references.forEach((reference) => consumedReferences.add(reference));
    const last = blocks.at(-1);
    edits.push({ start: heading.position.start.offset, end: nextStart(last), text: '' });
    removedRanges.push([heading.position.start.offset, last.position.end.offset]);
  }

  // 추천 목록에서만 쓰인 링크 정의를 제거한다.
  const stillUsed = new Set();
  visit(tree, ['linkReference', 'imageReference'], (node) => {
    if (consumedReferences.has(node)) return;
    const offset = node.position.start.offset;
    if (removedRanges.some(([start, end]) => offset >= start && offset < end)) return;
    stillUsed.add(node.identifier);
  });
  const consumedIds = new Set([...consumedReferences].map((node) => node.identifier));
  for (const id of consumedIds) {
    const definition = definitions.get(id);
    if (stillUsed.has(id) || !children.includes(definition)) continue;
    const position = children.indexOf(definition) + 1;
    const end = position < children.length ? children[position].position.start.offset : body.length;
    edits.push({ start: definition.position.start.offset, end, text: '' });
  }

  const recommendedPosts = [];
  const seen = new Set();
  for (const link of [...sections.before, ...sections.next]) {
    const url = new URL(link.href, new URL(canonicalPath, liveSite));
    const key = url.origin === liveSite
      ? `${url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`}${url.search}${url.hash}`
      : url.href;
    if (seen.has(key)) continue;
    seen.add(key);
    recommendedPosts.push(link);
  }

  // 4. 간격용 <br/> → .block-break
  // 레거시 글은 블록 사이에 <br/>만 따로 적어 간격을 만들었다. (문단·표 안의 줄바꿈 <br/>은 그대로 둔다)
  // - 본문 맨 앞의 <br/>: 지운다.
  // - 이미지 블록·표 바로 뒤의 <br/>: 지우고 앞 블록에 block-break 클래스를 붙인다.
  //   한 요소(<div>…</div>, <p>…</p>)면 그 요소에, 이미지 + <center> 캡션이나 표면 <div class="block-break">로 감싼다.
  const removeUntilNext = (index) => {
    const next = children[index + 1];
    edits.push({ start: children[index].position.start.offset, end: next ? next.position.start.offset : body.length, text: '' });
  };
  for (let index = 0; isLineBreak(children[index]); index += 1) removeUntilNext(index);
  for (let index = 1; index < children.length; index += 1) {
    if (!isLineBreak(children[index]) || isLineBreak(children[index - 1])) continue;
    const block = children[index - 1];
    const { start, end } = block.position;
    const html = block.type === 'html' ? body.slice(start.offset, end.offset) : '';
    if (block.type !== 'table' && !/<img\b/i.test(html)) continue;
    const open = /^<[a-z][a-z0-9]*\b[^>]*>/i.exec(html)?.[0];
    if (open && isSingleElement(html)) {
      const marked = /\bclass="/i.test(open)
        ? open.replace(/\bclass="/i, 'class="block-break ')
        : open.replace(/^(<[a-z][a-z0-9]*)/i, '$1 class="block-break"');
      edits.push({ start: start.offset, end: start.offset + open.length, text: marked });
    } else {
      // 표처럼 Markdown 블록을 감쌀 때는 빈 줄을 두어야 안쪽이 Markdown으로 처리된다.
      const gap = block.type === 'table' ? '\n\n' : '\n';
      edits.push({ start: start.offset, end: start.offset, text: `<div class="block-break">${gap}` });
      edits.push({ start: end.offset, end: end.offset, text: `${gap}</div>` });
    }
    removeUntilNext(index);
  }

  // 편집 적용
  edits.sort((a, b) => b.start - a.start || b.end - a.end);
  let converted = body;
  let floor = Infinity;
  for (const edit of edits) {
    if (edit.end > floor) throw new Error(`${relative}: 겹치는 변환이 있습니다 (${lineOf(edit.start)}행).`);
    converted = converted.slice(0, edit.start) + edit.text + converted.slice(edit.end);
    floor = edit.start;
  }
  converted = `${converted.replace(/\s+$/, '')}\n`;

  // 5. 변환 후 남은 구문과 Jekyll 렌더링 차이를 기록한다.
  const after = parseMarkdown(converted);
  const afterCode = [];
  const languages = new Set();
  visit(after, ['code', 'inlineCode'], (node) => {
    afterCode.push([node.position.start.offset, node.position.end.offset]);
    if (node.type === 'code') languages.add(node.lang ?? '');
  });
  const afterInCode = (offset) => afterCode.some(([start, end]) => offset >= start && offset < end);
  for (const match of converted.matchAll(liquidLike)) {
    if (afterInCode(match.index)) note('liquid-in-code', null, `Jekyll은 코드 안의 \`${match[0]}\`도 Liquid로 처리했지만 새 사이트는 원문 그대로 표시합니다.`);
    else note('liquid-unsupported', null, `변환하지 못한 Liquid 구문 \`${match[0]}\`이 남아 있습니다.`);
  }
  for (const match of converted.matchAll(spacedLiquid)) {
    if (afterInCode(match.index)) {
      note('spaced-liquid', null, 'Jekyll 충돌을 피하려고 띄어 쓴 중괄호(`{ {`, `{ %`)가 코드에 있습니다. 원문을 유지했으며 작성자 확인이 필요합니다.');
      break;
    }
  }

  const images = [];
  visit(after, 'image', (node) => { images.push(node.url); });
  visit(after, 'html', (node) => {
    for (const match of node.value.matchAll(/<(?:img|iframe)\b[^>]*\bsrc="([^"]+)"/g)) images.push(match[1]);
  });
  const links = [];
  const afterDefinitions = new Map();
  visit(after, 'definition', (node) => afterDefinitions.set(node.identifier, node.url));
  visit(after, ['link', 'linkReference'], (node) => {
    const url = node.type === 'link' ? node.url : afterDefinitions.get(node.identifier);
    if (url) links.push(url);
  });
  const headings = [];
  visit(after, 'heading', (node) => { headings.push({ depth: node.depth, text: toString(node) }); });
  let codeBlocks = 0;
  visit(after, 'code', () => { codeBlocks += 1; });

  const override = overrides[relative] ?? {};
  const frontmatter = [
    '---',
    `title: ${quote(data.title)}`,
    `publishedAt: ${quote(publishedAt)}`,
    `updatedAt: ${quote(normalizeTimestamp(data.last_modified_at, relative))}`,
    `canonicalPath: ${quote(canonicalPath)}`,
    'categories:',
    ...categories.map((category) => `  - ${quote(category)}`),
  ];
  if (Array.isArray(data.tags) && data.tags.length) frontmatter.push('tags:', ...data.tags.map((tag) => `  - ${quote(String(tag))}`));
  if (override.summary) frontmatter.push(`summary: ${quote(override.summary)}`);
  if (data.hidden === true) frontmatter.push('hidden: true');
  if (recommendedPosts.length) {
    frontmatter.push('recommendedPosts:');
    for (const { title, href } of recommendedPosts) frontmatter.push(`  - title: ${quote(title)}`, `    href: ${quote(href)}`);
  }
  frontmatter.push('---', '');

  const known = new Set(['title', 'category', 'last_modified_at', 'search', 'tags', 'hidden']);
  const unknown = Object.keys(data).filter((key) => !known.has(key));
  if (unknown.length) note('frontmatter-dropped', null, `옮기지 않은 frontmatter 필드: ${unknown.join(', ')}`);

  return {
    output: `${frontmatter.join("\n")}${converted}`,
    outputPath: path.join(contentDir, `${kind}s`, `${collectionPath}.md`),
    report,
    manifest: {
      kind,
      source: relative,
      sourceSha256: sha256(normalized),
      canonicalPath,
      publishedAt,
      updatedAt: normalizeTimestamp(data.last_modified_at, relative),
      categories,
      jekyllSearch: data.search ?? null,
      recommendedPosts: recommendedPosts.length,
      headings,
      codeBlocks,
      codeLanguages: [...languages].sort(),
      images: [...new Set(images)].sort(),
      links: [...new Set(links)].sort(),
    },
  };
}

// ---------------------------------------------------------------------------

const results = kinds.flatMap(({ kind, dir }) =>
  listMarkdown(path.join(source, dir)).map((file) => convert({ kind, file, text: readFileSync(file, 'utf8') })),
);

const errors = [];
const byPath = new Map();
for (const { manifest } of results) {
  const duplicate = byPath.get(manifest.canonicalPath);
  if (duplicate) errors.push(`경로 충돌: ${manifest.canonicalPath} (${duplicate}, ${manifest.source})`);
  byPath.set(manifest.canonicalPath, manifest.source);
}

// 운영 사이트맵과 기술 글 경로를 대조한다.
const baselineFile = path.join(migrationDir, 'baseline/sitemap.xml');
const baseline = [...readFileSync(baselineFile, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, loc]) => new URL(loc).pathname);
const baselineLastmod = new Map(
  [...readFileSync(baselineFile, 'utf8').matchAll(/<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g)]
    .map(([, loc, lastmod]) => [new URL(loc).pathname, lastmod]),
);
const postPaths = new Set(results.filter(({ manifest }) => manifest.kind === 'post').map(({ manifest }) => manifest.canonicalPath));
const missing = baseline.filter((pathname) => !postPaths.has(pathname));
const extra = [...postPaths].filter((pathname) => !baseline.includes(pathname));
missing.forEach((pathname) => errors.push(`운영 사이트맵에 있으나 변환 결과에 없는 경로: ${pathname}`));
extra.forEach((pathname) => errors.push(`변환 결과에 있으나 운영 사이트맵에 없는 경로: ${pathname}`));
for (const { manifest } of results) {
  const lastmod = baselineLastmod.get(manifest.canonicalPath);
  if (lastmod && new Date(lastmod).getTime() !== new Date(manifest.updatedAt).getTime()) {
    errors.push(`수정일 불일치: ${manifest.source} ${manifest.updatedAt} ≠ 운영 ${lastmod}`);
  }
}

// 추천·본문 내부 링크가 기준 경로 목록에 있는지 확인한다.
const allPaths = new Set(byPath.keys());
const internalReport = [];
for (const { manifest, report } of results) {
  for (const href of manifest.links) {
    let url;
    try { url = new URL(href, new URL(manifest.canonicalPath, liveSite)); } catch { continue; }
    if (url.origin !== liveSite || /\.(png|jpe?g|gif|svg|pdf|xml)$/i.test(url.pathname)) continue;
    const pathname = decodeURI(url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`);
    if (allPaths.has(pathname) || ['/', '/about/', '/posts/', '/logs/'].includes(pathname)) continue;
    report.push({ type: 'internal-link', file: manifest.source, line: null, detail: `기준 경로 목록에 없는 내부 링크: ${href}` });
    internalReport.push(href);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

const manifest = {
  generator: 'scripts/migrate-content.mjs',
  sourcesSha256: sha256(results.map(({ manifest: entry }) => `${entry.source}:${entry.sourceSha256}`).join('\n')),
  counts: Object.fromEntries(kinds.map(({ kind }) => [kind, results.filter(({ manifest: entry }) => entry.kind === kind).length])),
  entries: results.map(({ manifest: entry }) => entry),
};

const reportEntries = results.flatMap(({ report }) => report);
const reportTypes = {
  'recommend-kept': '추천 섹션을 원문에 남김 (확인 필요)',
  'internal-link': '기준 경로 목록에 없는 내부 링크',
  'liquid-unsupported': '변환하지 못한 Liquid 구문',
  'liquid-in-code': 'Jekyll과 렌더링이 달라지는 코드 안 Liquid 표기',
  'spaced-liquid': 'Jekyll 회피용으로 띄어 쓴 중괄호가 있는 코드',
  'code-language': '지원하지 않는 코드 언어 표기',
  'frontmatter-dropped': '옮기지 않은 frontmatter 필드',
  'recommend-empty': '제거한 빈 추천 섹션',
};
const lines = [
  '# 콘텐츠 변환 보고서',
  '',
  '`npm run migrate`가 생성한다. 직접 수정하지 않는다.',
  '',
  '## 요약',
  '',
  '| 항목 | 값 |',
  '| --- | --- |',
  `| 기술 글 | ${manifest.counts.post}편 |`,
  `| 회고 | ${manifest.counts.log}편 |`,
  `| 독서 기록 | ${manifest.counts.book}편 |`,
  `| 운영 사이트맵 대조 | ${baseline.length}개 경로 중 누락 ${missing.length}건, 초과 ${extra.length}건 |`,
  `| 경로 충돌 | 0건 |`,
  `| 추천 글이 있는 글 | ${results.filter(({ manifest: entry }) => entry.recommendedPosts).length}편 |`,
  `| 원본 묶음 SHA-256 | \`${manifest.sourcesSha256}\` |`,
  '',
  '## 확인 항목',
  '',
];
for (const [type, title] of Object.entries(reportTypes)) {
  const entries = reportEntries.filter((entry) => entry.type === type);
  lines.push(`### ${title} (${entries.length})`, '');
  if (entries.length === 0) {
    lines.push('없음', '');
    continue;
  }
  for (const entry of entries) lines.push(`- \`${entry.file}${entry.line ? `:${entry.line}` : ''}\` ${entry.detail}`);
  lines.push('');
}
const reportText = `${lines.join('\n').trimEnd()}\n`;

const outputs = new Map(results.map(({ outputPath, output }) => [outputPath, output]));
outputs.set(path.join(migrationDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
outputs.set(path.join(migrationDir, 'report.md'), reportText);

if (checkOnly) {
  const stale = [...outputs].filter(([file, text]) => !existsSync(file) || readFileSync(file, 'utf8') !== text);
  for (const { collection } of kinds) {
    const dir = path.join(contentDir, collection);
    if (existsSync(dir) && statSync(dir).isDirectory()) {
      for (const file of listMarkdown(dir)) if (!outputs.has(file)) stale.push([file]);
    }
  }
  if (stale.length) {
    console.error(`변환 결과가 최신이 아닙니다 (${stale.length}개 파일). npm run migrate를 실행하세요.`);
    stale.slice(0, 10).forEach(([file]) => console.error(`  ${path.relative(project, file)}`));
    process.exit(1);
  }
  console.log('변환 결과가 최신입니다.');
} else {
  for (const { collection } of kinds) rmSync(path.join(contentDir, collection), { recursive: true, force: true });
  for (const [file, text] of outputs) {
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, text);
  }
  console.log(`변환 완료: 기술 글 ${manifest.counts.post}편, 회고 ${manifest.counts.log}편, 독서 기록 ${manifest.counts.book}편`);
  console.log(`확인 항목 ${reportEntries.length}건 → migration/report.md`);
}
