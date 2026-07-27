/**
 * トップページなどの固定画像を、実際の表示サイズに合わせて配信するためのヘルパー。
 *
 * 対応表 site-images.json は scripts/optimize-images.mjs が
 * ビルド前（npm run build の第1段）に生成する。生成物なので .gitignore 済み。
 * （src/data/thumbs.json と同じ扱い。クローン直後は `npm run optimize:images` を先に実行する）
 *
 * 幅違いWebPが無い画像は元のJPEGをそのまま返すので、生成に失敗しても表示は変わらない。
 */
import manifest from './site-images.json';

/**
 * @param {string} src 元画像のURL（例: '/images/hero.jpg'）
 * @returns {{ src: string, width?: number, height?: number, webpSrcset?: string }}
 */
export function img(src) {
	const e = manifest[src];
	if (!e || !e.webp?.length) return { src };
	return {
		src,
		width: e.w,
		height: e.h,
		webpSrcset: e.webp.map((v) => `${v.src} ${v.w}w`).join(', '),
	};
}
