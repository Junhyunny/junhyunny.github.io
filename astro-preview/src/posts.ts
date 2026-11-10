import type { CollectionEntry } from 'astro:content';

export const siteName = "Junhyunny's Devlogs";
export const liveSite = 'https://junhyunny.github.io';
export const bookTitle = '안쪽까지 들여다보는 스프링 시큐리티';
export const bookUrl = 'https://www.yes24.com/product/goods/180391041';

const previewPosts: Record<string, { path: string; summary?: string }> = {
  '2026-10-31-kotlin-coroutine-architecture': {
    path: 'kotlin/coroutine/asynchronous/architecture/kotlin-coroutine-architecture',
    summary: 'CoroutineScope에서 Dispatcher와 Job까지, 코틀린 코루틴이 비동기 작업을 실행하고 관리하는 구조를 살펴봅니다.',
  },
  '2026-10-15-swift-ui-identity-lifetime-dependencies': {
    path: 'swift/swift-ui/view/lifecycle/swift-ui-identity-lifetime-dependencies',
    summary: '정체성, 생명주기, 의존성이라는 세 개념으로 SwiftUI가 뷰를 다시 평가하는 과정을 살펴봅니다.',
  },
  '2026-10-13-swift-automatic-reference-counting': {
    path: 'swift/swift-ui/arc/automatic-reference-counting/garbage-collecting/swift-automatic-reference-counting',
    summary: '스위프트가 참조 횟수로 객체의 생명주기와 메모리를 관리하는 방식을 살펴봅니다.',
  },
  '2022-04-04-javascript-hoisting': {
    path: 'javascript/javascript-hoisting',
    summary: '실행 컨텍스트를 바탕으로 자바스크립트 호이스팅의 동작을 예제와 함께 살펴봅니다.',
  },
};

export function postDetails(post: CollectionEntry<'posts'>) {
  const details = previewPosts[post.id];
  if (!details) throw new Error(`Missing preview route for ${post.id}`);
  const date = post.id.slice(0, 10);
  return { ...details, date, label: date.replaceAll('-', '.'), href: `/${details.path}/` };
}
