// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import remarkPricing from './plugins/remark-pricing.mjs';
import rehypeImgAttrs from './plugins/rehype-img-attrs.mjs';

// https://astro.build/config
export default defineConfig({
	    site: 'https://theheadquarters.jp',
	integrations: [mdx(), sitemap({
		// /kobe/ は広告着地用LP（canonicalはトップ）なのでサイトマップから除外する
		filter: (page) => !page.includes('/admin') && !page.endsWith('/kobe/'),
	})],
	markdown: {
		remarkPlugins: [remarkPricing],
		rehypePlugins: [rehypeImgAttrs],
	},
});
