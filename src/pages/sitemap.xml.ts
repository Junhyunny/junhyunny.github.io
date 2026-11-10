import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getPosts, liveSite, newestFirst } from '../posts';

// 검색 콘솔·네이버·robots.txt가 참조하는 /sitemap.xml. 기존 Jekyll 사이트맵과 같은 형식(lastmod, changefreq, priority)을 쓴다.
// 기존에는 기술 글만 넣었지만 회고·독서 기록과 주요 페이지도 함께 넣는다.
const escape = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

export const GET: APIRoute = async () => {
  const entries = [
    ...(await getPosts()),
    ...(await getCollection('logs', ({ data }) => !data.hidden)).sort(newestFirst),
    ...(await getCollection('books', ({ data }) => !data.hidden)).sort(newestFirst),
  ];
  const urls: { loc: string; lastmod?: string }[] = [
    ...['/', '/about/', '/posts/', '/logs/', '/books/'].map((path) => ({ loc: path })),
    ...entries.map(({ data }) => ({ loc: data.canonicalPath, lastmod: data.updatedAt })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(({ loc, lastmod }) => `  <url>
    <loc>${escape(new URL(loc, liveSite).href)}</loc>${lastmod ? `
    <lastmod>${lastmod}</lastmod>` : ''}
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`).join('\n')}
</urlset>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
