/**
 * Markdown 本文中の <img> に、見た目を変えずに以下を付与する。
 *  - loading="lazy" / decoding="async"  … 表示速度の改善
 *  - width / height                     … CLS(レイアウトのガタつき)の防止
 * width/height は WordPress が生成した「-1024x683」形式のファイル名から取得する。
 * 全参照画像227件でファイル名の値が実寸と一致することを確認済み（2026-07-25）。
 * CSS 側に img { max-width:100%; height:auto } があるため、属性を足しても表示は変わらない。
 */
const SIZE_RE = /-(\d{2,4})x(\d{2,4})\.(jpe?g|png|webp|avif|gif)$/i;

function walk(node, fn) {
	fn(node);
	const kids = node.children;
	if (Array.isArray(kids)) for (const k of kids) walk(k, fn);
}

export default function rehypeImgAttrs() {
	return (tree) => {
		walk(tree, (node) => {
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
		});
	};
}
