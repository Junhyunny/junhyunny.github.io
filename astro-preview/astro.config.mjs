import { defineConfig } from 'astro/config';
import { visit } from 'unist-util-visit';
import { formatAboutResume, moveRecommendedPosts } from './preview-content.mjs';

const imageVariable = /\{\{\s*site\.image_url_(20\d{2})\s*\}\}/g;
const codepenInclude = /^\{% include codepen\.html hash="([A-Za-z0-9]+)" tab="([a-z,]+)" title="([^"]+)" %\}$/;
const githubExample = /^https:\/\/github\.com\/[^/]+\/([\w.-]+)\/tree\/[^/]+\/\d{4}-\d{2}-\d{2}-([\w.-]+)\/?$/;

function legacyPreviewMarkup() {
  return (tree, file) => {
    visit(tree, 'html', (node) => {
      node.value = node.value.replace(imageVariable, (_, year) =>
        `https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-${year}/main`,
      );
    });

    visit(tree, 'paragraph', (node, index, parent) => {
      const start = node.position?.start.offset;
      const end = node.position?.end.offset;
      if (!parent || index === undefined || start === undefined || end === undefined) return;
      const match = codepenInclude.exec(String(file.value).slice(start, end));
      if (!match) return;

      const [, hash, tab, title] = match;
      const escapedTitle = title.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
      parent.children[index] = {
        type: 'html',
        value: `<iframe class="codepen" src="https://codepen.io/Junhyunny/embed/${hash}?default-tab=${tab}" title="${escapedTitle}" loading="lazy" allowfullscreen></iframe><p><a href="https://codepen.io/Junhyunny/pen/${hash}/">CodePen에서 예제 열기</a></p>`,
      };
    });
  };
}

function labelExampleRepositories() {
  return (tree) => {
    visit(tree, 'heading', (heading, index, parent) => {
      if (!parent || index === undefined || heading.children.length !== 1) return;
      const [title] = heading.children;
      if (title.type !== 'text' || title.value.trim().toLowerCase() !== 'test code repository') return;
      const list = parent.children[index + 1];
      if (list?.type !== 'list') return;

      visit(list, 'link', (link) => {
        const [label] = link.children;
        if (link.children.length !== 1 || label.type !== 'text' || label.value !== link.url) return;
        const match = githubExample.exec(link.url);
        if (!match) return;

        label.value = `${match[1]} / ${match[2]}`;
        link.children.push({ type: 'html', value: '<small class="repo-link-meta">GitHub · 예제 코드</small>' });
      });
    });
  };
}

export default defineConfig({
  site: 'https://junhyunny.github.io',
  trailingSlash: 'always',
  markdown: {
    remarkPlugins: [legacyPreviewMarkup, labelExampleRepositories, moveRecommendedPosts, formatAboutResume],
    shikiConfig: { theme: 'github-dark-dimmed' },
  },
});
