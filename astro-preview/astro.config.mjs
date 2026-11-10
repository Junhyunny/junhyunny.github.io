import { defineConfig } from 'astro/config';
import remarkCjkFriendly from 'remark-cjk-friendly';
import { visit } from 'unist-util-visit';
import { formatAboutResume } from './preview-content.mjs';

const site = 'https://junhyunny.github.io';
const githubExample = /^https:\/\/github\.com\/[^/]+\/([\w.-]+)\/tree\/[^/]+\/\d{4}-\d{2}-\d{2}-([\w.-]+)\/?$/;

// 본문 끝의 링크 목록 소제목 → .link-list 변형
// cards: 링크마다 박스, grouped: 목록 전체를 하나의 박스로 묶고 항목 사이에 구분선
const linkListSections = { 'test code repository': 'cards', reference: 'grouped' };

const addClass = (node, ...names) => {
  node.data ??= {};
  node.data.hProperties ??= {};
  node.data.hProperties.className = [...(node.data.hProperties.className ?? []), ...names];
};

const isExternal = (url) => {
  try {
    return new URL(url, `${site}/`).origin !== site;
  } catch {
    return false;
  }
};

// 예제 저장소 주소만 적힌 링크를 "저장소 / 예제 이름"과 설명으로 바꾼다.
function labelExampleRepository(link) {
  const [label] = link.children;
  if (link.children.length !== 1 || label.type !== 'text' || label.value !== link.url) return;
  const match = githubExample.exec(link.url);
  if (!match) return;
  label.value = `${match[1]} / ${match[2]}`;
  link.data = { ...link.data, meta: 'GitHub · 예제 코드' };
}

// 소제목과 바로 뒤 목록에 클래스를 붙여 CSS가 제목 id나 형제 선택자에 의존하지 않게 한다.
function markLinkLists() {
  return (tree) => {
    const definitions = new Map();
    visit(tree, 'definition', (node) => { definitions.set(node.identifier, node.url); });

    visit(tree, 'heading', (heading, index, parent) => {
      if (!parent || index === undefined || heading.children.length !== 1) return;
      const [title] = heading.children;
      if (title.type !== 'text') return;
      const variant = linkListSections[title.value.trim().toLowerCase()];
      const list = parent.children[index + 1];
      if (!variant || list?.type !== 'list') return;

      addClass(heading, 'link-list-heading');
      addClass(list, 'link-list', `link-list--${variant}`);
      for (const item of list.children) {
        let hasLink = false;
        visit(item, ['link', 'linkReference'], (link) => {
          hasLink = true;
          if (link.type === 'link' && variant === 'cards') labelExampleRepository(link);
          const url = link.type === 'link' ? link.url : definitions.get(link.identifier);
          addClass(link, 'link-list__link', ...(url && isExternal(url) ? ['link-list__link--external'] : []));
          // 호버 밑줄이 설명·화살표에는 생기지 않도록 제목만 감싼다.
          const meta = link.data?.meta;
          link.children = [
            { type: 'linkListTitle', children: link.children, data: { hName: 'span', hProperties: { className: ['link-list__title'] } } },
            ...(meta ? [{ type: 'html', value: `<small class="link-list__meta">${meta}</small>` }] : []),
          ];
          return 'skip';
        });
        // 링크 없이 책 제목만 적은 참고 자료
        if (!hasLink) addClass(item, 'link-list__text');
      }
    });
  };
}

export default defineConfig({
  site,
  trailingSlash: 'always',
  markdown: {
    // 한국어 조사가 붙은 강조(**'인용'**라는, **용어(Term)**는)를 Jekyll(kramdown)처럼 처리한다.
    remarkPlugins: [remarkCjkFriendly, markLinkLists, formatAboutResume],
    shikiConfig: { theme: 'github-dark-dimmed' },
  },
});
