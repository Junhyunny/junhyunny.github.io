import type { APIRoute } from 'astro';
import { getPosts, liveSite, siteName } from '../posts';

// 기존 Jekyll feed.xml과 같은 주소·형식: 최신 기술 글 10편, 본문 전체, 카테고리.
const escape = (value: string) =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const rfc822 = (value: string | Date) => new Date(value).toUTCString();

export const GET: APIRoute = async () => {
  const posts = (await getPosts()).slice(0, 10);
  const items = posts.map(({ data, rendered }) => {
    const link = new URL(data.canonicalPath, liveSite).href;
    const categories = data.categories.map((name) => `      <category>${escape(name)}</category>`);
    return `    <item>
      <title>${escape(data.title)}</title>
      <description>${escape(rendered?.html ?? data.summary ?? '')}</description>
      <pubDate>${rfc822(`${data.publishedAt}T00:00:00+09:00`)}</pubDate>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
${categories.join('\n')}
    </item>`;
  });

  const now = rfc822(new Date());
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escape(siteName)}</title>
    <description>소프트웨어 엔지니어 / 작가</description>
    <link>${liveSite}/</link>
    <atom:link href="${liveSite}/feed.xml" rel="self" type="application/rss+xml"/>
    <pubDate>${now}</pubDate>
    <lastBuildDate>${now}</lastBuildDate>
    <generator>Astro</generator>
${items.join('\n')}
  </channel>
</rss>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
