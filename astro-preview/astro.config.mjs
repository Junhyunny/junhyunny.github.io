import { defineConfig } from 'astro/config';
import remarkCjkFriendly from 'remark-cjk-friendly';
import { visit } from 'unist-util-visit';
import { formatAboutResume } from './preview-content.mjs';

const githubExample = /^https:\/\/github\.com\/[^/]+\/([\w.-]+)\/tree\/[^/]+\/\d{4}-\d{2}-\d{2}-([\w.-]+)\/?$/;

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
    // 한국어 조사가 붙은 강조(**'인용'**라는, **용어(Term)**는)를 Jekyll(kramdown)처럼 처리한다.
    remarkPlugins: [remarkCjkFriendly, labelExampleRepositories, formatAboutResume],
    shikiConfig: { theme: 'github-dark-dimmed' },
  },
});
