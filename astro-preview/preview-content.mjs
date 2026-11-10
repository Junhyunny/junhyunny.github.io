function element(hName, children, hProperties = {}) {
  return { type: 'previewElement', data: { hName, hProperties }, children };
}

function formatAchievements(heading, list) {
  if (list?.type !== 'list' || list.children.length === 0) return;
  const rows = [];
  for (const item of list.children) {
    const [label, results] = item.children;
    if (item.children.length !== 2 || label?.type !== 'paragraph' || results?.type !== 'list') return;
    const [company, period] = label.children;
    if (label.children.length !== 2 || company?.type !== 'strong' || period?.type !== 'text') return;
    const years = /^\s*\((.+)\)\s*$/.exec(period.value)?.[1];
    if (!years) return;

    rows.push(element('div', [
      element('div', [
        element('h3', company.children),
        element('p', [{ type: 'text', value: years }], { className: ['entry-meta'] }),
      ]),
      results,
    ], { className: ['achievement'] }));
  }

  const title = { ...heading, data: { hProperties: { id: 'achievements' } } };
  return element('section', [
    element('div', [
      title,
      element('span', [{ type: 'text', value: 'SELECTED IMPACT' }], { className: ['eyebrow'] }),
    ], { className: ['section-heading'] }),
    ...rows,
  ], { className: ['about-achievements'], ariaLabelledBy: 'achievements' });
}

export function formatAboutResume() {
  const legacyHeader = /^<div class="resume-header">\s*<img src="(\/images\/about\/[^"]+)"[^>]*>\s*(<h3\b[\s\S]*?<\/h3>)\s*<\/div>\s*$/;
  const highlights = new Map([
    ['bekindlabs', 'Toyota DIG 팀에서 애자일 프랙티스를 강화하고, 기술 부채를 분석·해소하며 테스트 커버리지를 개선했습니다.'],
    ['vmware', 'Toyota, Honda, KB국민은행 등의 프로젝트에서 도메인 설계, 인증 통합, 데이터 마이그레이션을 맡았습니다.'],
    ['geneuin', 'IoT 돌봄 서비스와 반도체 가스 공정 관리 시스템을 개발했습니다.'],
    ['posco-ict', '제철소 야드 관리 시스템을 운영하고, 모놀리스를 마이크로서비스로 재구축하는 프로젝트에 참여했습니다.'],
  ]);
  return (tree, file) => {
    // Windows에서는 경로 구분자가 \ 이므로 / 로 맞춘 뒤 비교한다.
    if (!file.path?.replaceAll('\\', '/').endsWith('/_pages/about.md')) return;

    const index = tree.children.findIndex((node) =>
      node.type === 'heading' && node.depth === 2 && node.children[0]?.value === '주요 성과'
    );
    if (index >= 0) {
      const formatted = formatAchievements(tree.children[index], tree.children[index + 1]);
      if (formatted) tree.children.splice(index, 2, formatted);
    }

    const sections = [];
    let detail;
    for (const node of tree.children) {
      if (node.type === 'heading' && node.depth === 2) detail = undefined;
      const header = node.type === 'html' ? legacyHeader.exec(node.value) : null;
      if (header) {
        const [, image, heading] = header;
        const companyId = /^<h3\b[^>]*\bid="([^"]+)"/.exec(heading)?.[1];
        const highlight = highlights.get(companyId);
        const label = [{ type: 'html', value: heading }];
        if (highlight) {
          label.push({
            type: 'resumeHighlight',
            data: { hName: 'span', hProperties: { className: ['resume-highlight'] } },
            children: [{ type: 'text', value: highlight }],
          });
        }
        detail = {
          type: 'resumeDetails',
          data: { hName: 'details', hProperties: { className: ['resume-detail'] } },
          children: [{
            type: 'resumeSummary',
            data: { hName: 'summary' },
            children: [
              { type: 'image', url: `..${image}`, alt: '' },
              { type: 'resumeLabel', data: { hName: 'div' }, children: label },
            ],
          }],
        };
        sections.push(detail);
      } else {
        (detail?.children ?? sections).push(node);
      }
    }
    tree.children = sections;
  };
}
