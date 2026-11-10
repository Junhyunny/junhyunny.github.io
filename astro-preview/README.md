# Junhyunny’s Devlogs (Astro)

Jekyll 블로그를 옮긴 Astro 프로젝트입니다. Home, Archive, Article, About, Logs와 기존 글 전체(기술 글 525편, 회고 16편, 독서 기록 10편)를 기존 주소 그대로 생성합니다.

```sh
cd astro-preview
npm ci
npm run migrate        # 상위 디렉터리의 _posts, _logs, _books를 src/content로 변환
npm run migrate:check  # 변환 결과가 원본과 일치하는지 확인
npm run check
npm run build
npm run preview -- --host 127.0.0.1
```

- 변환 도구: `scripts/migrate-content.mjs`. 원본은 읽기만 하며 같은 입력에서 항상 같은 결과를 만듭니다.
- 변환 결과: `src/content/{posts,logs,books}`. 직접 고치지 말고 원본을 고친 뒤 `npm run migrate`를 다시 실행합니다.
- 기준 자료: `migration/baseline/sitemap.xml`(운영 사이트맵). 기술 글 경로와 수정일이 하나라도 다르면 변환이 실패합니다.
- 보고서: `migration/report.md`(확인이 필요한 항목), `migration/manifest.json`(원본 SHA-256, 경로, 날짜, 카테고리, 소제목, 이미지, 링크).
- 원본에 없는 요약은 `migration/overrides.json`으로만 추가합니다.

빌드에서 기술 글 전체의 Pagefind 검색 색인을 생성합니다. 회고와 독서 기록은 기존 주소에 생성하되 검색에서는 제외합니다. 댓글은 기존과 같은 utterances 설정(`issue-term=pathname`)을 사용합니다.

기존 글의 변환 규칙과 운영 전환 기준은 [마이그레이션 계획](./MIGRATION_PLAN.md)에 정리했습니다.
