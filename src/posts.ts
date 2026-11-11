import { getCollection, type CollectionEntry } from 'astro:content';

export const siteName = "Junhyunny's Devlogs";
export const liveSite = 'https://junhyunny.github.io';
export const bookTitle = '안쪽까지 들여다보는 스프링 시큐리티';
export const bookUrl = 'https://www.yes24.com/product/goods/180391041';

export type Entry = CollectionEntry<'posts'> | CollectionEntry<'logs'>;

export function postDetails(entry: Entry) {
  const { publishedAt, canonicalPath, summary } = entry.data;
  return {
    path: canonicalPath.slice(1, -1),
    href: canonicalPath,
    summary,
    date: publishedAt,
    year: publishedAt.slice(0, 4),
    label: publishedAt.replaceAll('-', '.'),
  };
}

// 최신 글이 먼저 오도록 게시일, 같은 날이면 파일명 역순으로 정렬한다.
export const newestFirst = (a: Entry, b: Entry) =>
  b.data.publishedAt.localeCompare(a.data.publishedAt) || b.id.localeCompare(a.id);

export async function getPosts() {
  return (await getCollection('posts')).sort(newestFirst);
}
