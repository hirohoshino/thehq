/**
 * Markdown 本文中の <img> に、見た目を変えずに以下を適用する。
 *  - loading="lazy" / decoding="async"  … 表示速度の改善
 *  - width / height                     … CLS(レイアウトのガタつき)の防止
 *  - <picture> でのWebP配信              … 転送量の削減（対応ブラウザのみ）
 *
 * width/height は WordPress が生成した「-1024x683」形式のファイル名から取得する。
 * 全参照画像でファイル名の値が実寸と一致することを確認済み（2026-07-25）。
 * CSS 側に img { max-width:100%; height:auto } があるため、属性を足しても表示は変わらない。
 *
 * WebPは public/ 配下に同名の .webp が存在する場合だけ <source> を追加する。
 * 非対応ブラウザは従来どおり <img> の JPEG/PNG を読むので、表示は変わらない。
 */
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SIZE_RE = /-(\d{2,4})x(\d{2,4})\.(jpe?g|png|webp|avif|gif)$/i;
const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url));
const SITE = 'https://theheadquarters.jp/';

function walk(node, fn, parent) {
	fn(node, parent);
	const kids = node.children;
	if (Array.isArray(kids)) for (const k of kids) walk(k, fn, node);
}

/** 画像URL -> public/ 配下の相対パス（外部URLや存在しないものは null） */
function toLocalPath(src) {
	let s = String(src ?? '').split(/[?#]/)[0];
	if (s.startsWith(SITE)) s = '/' + s.slice(SITE.length);
	else if (s.startsWith('http://') || s.startsWith('https://')) return null;
	if (!s.startsWith('/')) return null;
	try { s = decodeURIComponent(s); } catch {}
	return s.slice(1);
}

export default function rehypeImgAttrs() {
	return (tree) => {
		const swaps = [];
		walk(tree, (node, parent) => {
			if (node.type !== 'element' || node.tagName !== 'img') return;
			const p = (node.properties ||= {});
			if (p.loading == null) p.loading = 'lazy';
			if (p.decoding == null) p.decoding = 'async';
			if (p.width == null && p.height == null) {
				let src = String(p.src ?? '').split(/[?#]/)[0];
				try { src = decodeURIComponent(src); } catch {}
				const m = SIZE_RE.exec(src);
				if (m) { p.width = Number(m[1]); p.height = Number(m[2]); }
			}
			// WebP が用意されていれば <picture> でラップする
			const rel = toLocalPath(p.src);
			if (!rel || !/\.(jpe?g|png)$/i.test(rel)) return;
			const webpRel = rel.replace(/\.(jpe?g|png)$/i, '.webp');
			if (!existsSync(PUBLIC + webpRel)) return;
			const webpUrl = String(p.src).replace(/\.(jpe?g|png)(?=$|[?#])/i, '.webp');
			if (parent && Array.isArray(parent.children)) swaps.push({ parent, node, webpUrl });
		});
		for (const { parent, node, webpUrl } of swaps) {
			const i = parent.children.indexOf(node);
			if (i < 0) continue;
			parent.children[i] = {
				type: 'element', tagName: 'picture', properties: {},
				children: [
					{ type: 'element', tagName: 'source',
					  properties: { srcSet: webpUrl, type: 'image/webp' }, children: [] },
					node,
				],
			};
		}
	};
}
