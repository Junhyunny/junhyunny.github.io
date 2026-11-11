import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// 기술 글·회고·독서 기록은 scripts/migrate-content.mjs가 생성한 같은 형식을 사용한다.
const entry = z.object({
  title: z.string(),
  publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  updatedAt: z.string().datetime({ offset: true }),
  canonicalPath: z.string().regex(/^\/(?:[^/\s]+\/)+$/),
  categories: z.array(z.string()).min(1),
  summary: z.string().optional(),
  hidden: z.boolean().optional(),
  recommendedPosts: z.array(z.object({ title: z.string(), href: z.string() })).optional(),
});

const collection = (base: string) => defineCollection({
  loader: glob({ base, pattern: '**/*.md', generateId: ({ entry: file }) => file.replace(/\.md$/, '') }),
  schema: entry,
});

const pages = defineCollection({
  loader: glob({ base: './src/content/pages', pattern: 'about.md' }),
});

export const collections = {
  posts: collection('./src/content/posts'),
  logs: collection('./src/content/logs'),
  books: collection('./src/content/books'),
  pages,
};
