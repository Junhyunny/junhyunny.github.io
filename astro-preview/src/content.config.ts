import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({
    base: '../_posts',
    pattern: [
      '2026/2026-10-31-kotlin-coroutine-architecture.md',
      '2026/2026-10-15-swift-ui-identity-lifetime-dependencies.md',
      '2026/2026-10-13-swift-automatic-reference-counting.md',
      '2022/2022-04-04-javascript-hoisting.md',
    ],
    generateId: ({ entry }) => entry.split('/').at(-1)!.replace(/\.md$/, ''),
  }),
  schema: z.object({
    title: z.string(),
    category: z.array(z.string()).min(1),
    tags: z.array(z.string()).optional(),
  }),
});

const pages = defineCollection({
  loader: glob({ base: '../_pages', pattern: 'about.md' }),
});

const logs = defineCollection({
  loader: glob({
    base: '../_logs',
    pattern: '**/*.md',
    retainBody: false,
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
  schema: z.object({ title: z.string(), hidden: z.boolean().optional() }),
});

export const collections = { posts, pages, logs };
