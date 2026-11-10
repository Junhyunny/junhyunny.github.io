import { visit } from 'unist-util-visit';

export function moveRecommendedPosts() {
  return (tree, file) => {
    const headingIndex = tree.children.findIndex((node) =>
      node.type === 'heading' && node.children.length === 1 &&
      node.children[0].type === 'text' &&
      node.children[0].value.trim().toLowerCase() === 'recommend posts before this'
    );
    if (headingIndex < 0) return;
    const list = tree.children[headingIndex + 1];
    if (list?.type !== 'list' || list.children.length === 0) return;

    const definitions = new Map();
    visit(tree, 'definition', (node) => { definitions.set(node.identifier, node.url); });
    const links = [];
    for (const item of list.children) {
      const [paragraph] = item.children;
      if (item.children.length !== 1 || paragraph?.type !== 'paragraph' || paragraph.children.length !== 1) return;
      const [link] = paragraph.children;
      const href = link.type === 'link' ? link.url : link.type === 'linkReference' ? definitions.get(link.identifier) : undefined;
      if (!href || !link.children?.every((child) => child.type === 'text')) return;
      links.push({ href, title: link.children.map((child) => child.value).join('') });
    }

    file.data.astro.frontmatter.recommendedPosts = links;
    tree.children.splice(headingIndex, 2);
  };
}

const achievements = [
  {
    company: 'Toyota',
    years: '2023 – 2026',
    results: [
      '교육, 스포츠, 헬스케어, 행사 등 다양한 도메인의 웹·iOS 신규 서비스 6건을 MVP부터 출시까지 수행',
      'ACoE 팀에서 여러 제품 팀의 애자일 프랙티스 정착을 지원하고, Spring Security 내부 분석으로 OAuth2 인증 장애(스레드 락, WAF 호스트 재작성 등)의 근본 원인 해결',
      '이미지·영상 처리의 메모리 누수, OOM, 디스크 부족 문제를 해결하고, 썸네일 구조 리팩토링과 CloudFront CDN 구축으로 기술 부채 해소',
    ],
  },
  {
    company: 'Honda',
    years: '2024',
    results: ['공장 PLC 센서 데이터를 MQTT로 실시간 수집하는 용접 공정 모니터링 시스템 구축, 공정 속도와 버퍼 잔량 기반으로 목표 달성 시각 및 라인 정지 위험 시뮬레이션'],
  },
  {
    company: 'LG U+',
    years: '2023',
    results: ['차세대 시스템 전환 중 기존 클라이언트를 위한 API 하위 호환 어댑터 서비스 구축'],
  },
  {
    company: 'KB국민은행',
    years: '2022 – 2023',
    results: [
      '데스크톱 트레이딩 앱을 웹 서비스로 재구축하고, 부패 방지 계층(ACL)으로 레거시 의존성 격리',
      '마이데이터 기반 요금제 추천 MVP 개발, 레거시 EAI 메시징 모듈 리팩토링으로 코드 70% 축소',
    ],
  },
  {
    company: 'POSCO',
    years: '2018 – 2021',
    results: [
      '모놀리식 야드 관리 시스템을 마이크로서비스로 재설계, 품종별 일 3,000만 건 이상의 API 트래픽 처리',
      '인메모리 캐시와 카프카(Kafka) 기반 동기화로 공용 룰 엔진 응답 시간을 5초 이상에서 1초 미만으로 단축',
    ],
  },
];

function achievementsSection() {
  const escape = (text) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  const rows = achievements.map(({ company, years, results }) => `
    <div class="achievement">
      <div><h3>${escape(company)}</h3><p class="entry-meta">${escape(years)}</p></div>
      <ul>${results.map((result) => `<li>${escape(result)}</li>`).join('')}</ul>
    </div>`
  );
  return {
    type: 'html',
    value: `<section class="about-achievements" aria-labelledby="achievements">
      <div class="section-heading">
        <h2 id="achievements">주요 성과</h2>
        <span class="eyebrow">SELECTED IMPACT</span>
      </div>
      ${rows.join('')}
    </section>`,
  };
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
    if (!file.path?.endsWith('/_pages/about.md')) return;

    const sections = [];
    let detail;
    for (const node of tree.children) {
      if (node.type === 'heading' && node.depth === 2) {
        detail = undefined;
        if (node.children[0]?.value === '경력') sections.push(achievementsSection());
      }
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
