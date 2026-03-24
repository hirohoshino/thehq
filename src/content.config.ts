import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string(),
        description: z.string().optional().default(''),
        pubDate: z.coerce.date(),
        updatedDate: z.coerce.date().optional(),
        heroImage: image().optional(),

        // 追加：固定ページ/投稿の区別
        kind: z.enum(['post', 'page']).optional().default('post'),
        categories: z.array(z.string()).optional().default([]),
        coverImage: z.string().optional(),
        lang: z.string().optional(),
      })
      .passthrough(),
});

export const collections = { blog };
