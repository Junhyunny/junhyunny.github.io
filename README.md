## Junhyunny's Devlogs

안녕하세요, 개발자 강준현입니다. 저의 일상과 개발 관련 정보를 공유하는 블로그입니다. 글의 예제 코드들은 [blog-in-action][blog-in-action-repository] 저장소에서 확인할 수 있습니다.

[blog-in-action-repository]: https://github.com/Junhyunny/blog-in-action

## 개발

[Astro](https://astro.build)로 만든 정적 사이트이며 `master`에 푸시하면 GitHub Actions(`.github/workflows/deploy.yml`)가 GitHub Pages에 배포합니다.

```sh
npm ci
npm run dev       # http://localhost:4321
npm run check     # 타입·콘텐츠 스키마 검사
npm run build     # dist/ 생성 + Pagefind 검색 색인
npm run preview
```

- `astro.config.mjs`·`preview-content.mjs`의 Markdown 플러그인을 고쳤다면 렌더링 캐시를 비우도록 `npm run dev -- --force`로 실행합니다.
- 구글 애널리틱스(GA4)와 애드센스는 운영 빌드에서만 들어가고, 개발 서버에서는 광고 자리만 표시합니다.

## 디렉터리

| 경로 | 내용 |
| --- | --- |
| `src/content/posts`, `logs` | 기술 글, 회고 (Markdown) |
| `src/content/pages/about.md` | About 상세 이력 |
| `templates/post.md` | 새 기술 글 템플릿 (빌드에 포함되지 않음) |
| `src/pages` | 페이지와 `sitemap.xml`, `feed.xml` 생성 |
| `src/components/third-party` | GA4, 애드센스 |
| `public` | 사이트 루트로 그대로 나가는 파일 (검색 엔진 인증 HTML, `robots.txt`, `ads.txt`) |
| `images` | 회고·About·프로필 이미지. `public/images`는 이 디렉터리를 가리키는 링크로, `npm run dev`·`build` 전에 `scripts/link-public-images.mjs`가 만듭니다. |

## 새 글 작성

`templates/post.md`를 `src/content/posts/<연도>/<YYYY-MM-DD>-<slug>.md`로 복사해 작성합니다. 필드는 `src/content.config.ts`에서 검증합니다.

```markdown
---
title: "코틀린 코루틴 아키텍처 (Kotlin Coroutine Architecture)"
publishedAt: "2026-10-31"
updatedAt: "2026-10-31T23:30:18+09:00"
canonicalPath: "/kotlin/coroutine/kotlin-coroutine-architecture/"
categories:
  - kotlin
summary: "..."   # 선택
recommendedPosts: # 선택, '함께 읽으면 좋은 글'에 먼저 표시
  - title: "..."
    href: "/kotlin/..."
---

## 0. 들어가면서

#### TEST CODE REPOSITORY

- https://github.com/Junhyunny/blog-in-action/tree/master/2026-10-31-kotlin-coroutine-architecture

#### REFERENCE

- https://...
```

- `canonicalPath`가 글 주소입니다. 한 번 공개한 뒤에는 바꾸지 않습니다.
- `TEST CODE REPOSITORY`, `REFERENCE` 소제목 바로 아래 목록은 링크 박스로 표시됩니다.
- 이미지 블록 아래 간격이 필요하면 `<br/>` 대신 `class="block-break"`를 붙입니다.
