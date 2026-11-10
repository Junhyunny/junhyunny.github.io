# Junhyunny’s Devlogs 디자인 시안

Home, Archive, Article, About, Logs 검토용 Astro 프로젝트입니다. 상위 디렉터리의 원본 Markdown과 프로필 이미지를 사용합니다.

```sh
cd astro-preview
npm ci
npm run check
npm run build
npm run preview -- --host 127.0.0.1
```

빌드에서 표본 게시글 4편의 Pagefind 검색 색인을 생성합니다. 검색까지 확인하려면 빌드 후 미리보기 주소를 여세요. Archive의 필터는 표본 글에 적용됩니다. Logs 목록은 로컬에서 확인할 수 있으며, 개별 회고 글과 기존 댓글은 운영 사이트에서 열립니다.

기존 글의 변환 규칙과 운영 전환 기준은 [마이그레이션 계획](./MIGRATION_PLAN.md)에 정리했습니다.
