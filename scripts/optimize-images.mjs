/**
 * ビルド前に走る画像最適化スクリプト（astro build の前に実行される）。
 *
 * 1. public/ 配下の JPEG/PNG から WebP の兄弟ファイルを生成する。
 *    rehype-img-attrs.mjs が同名の .webp を見つけると <picture> で配信する。
 * 2. ブログ一覧（/blog/）用のサムネイルを public/thumbs/ に生成し、
 *    元画像URL → サムネイルの対応表を src/data/thumbs.json に書き出す。
 *    一覧が原寸画像を74枚読み込むのを防ぐため（14MB → 2.5MB）。
 *
 * 生成物は .gitignore 済み。リポジトリを太らせないため、毎ビルド生成する。
 * 既に存在し、元画像より新しいものはスキップするのでローカルの再ビルドは速い。
 */
import { readdir, stat, mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import sharp from 'sharp';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const PUBLIC = path.join(ROOT, 'public');
const THUMBS = path.join(PUBLIC, 'thumbs');
const CONTENT = path.join(ROOT, 'src/content/blog');
const SITE = 'https://theheadquarters.jp/';

const WEBP_QUALITY = 78;
const THUMB_WIDTH = 500;
const THUMB_QUALITY = 74;

async function walk(dir, out = []) {
	let entries;
	try { entries = await readdir(dir, { withFileTypes: true }); } catch { return out; }
	for (const e of entries) {
		const p = path.join(dir, e.name);
		if (e.isDirectory()) await walk(p, out);
		else out.push(p);
	}
	return out;
}

/** 元画像より新しい生成物があればスキップ */
async function isFresh(src, dest) {
	if (!existsSync(dest)) return false;
	const [a, b] = await Promise.all([stat(src), stat(dest)]);
	return b.mtimeMs >= a.mtimeMs;
}

async function generateWebp() {
	const files = (await walk(PUBLIC)).filter((p) => /\.(jpe?g|png)$/i.test(p) && !p.startsWith(THUMBS));
	let made = 0, skipped = 0, kept = 0;
	for (const src of files) {
		const dest = src.replace(/\.(jpe?g|png)$/i, '.webp');
		if (await isFresh(src, dest)) { kept++; continue; }
		try {
			await sharp(src).webp({ quality: WEBP_QUALITY }).toFile(dest);
			const [a, b] = await Promise.all([stat(src), stat(dest)]);
			// 効果が薄いものは置かない（<picture> も付かなくなる）
			if (b.size >= a.size * 0.95) { await import('node:fs/promises').then((m) => m.unlink(dest)); skipped++; }
			else made++;
		} catch { skipped++; }
	}
	console.log(`[optimize-images] WebP: 生成${made} / 既存${kept} / 見送り${skipped}`);
}

/** ブログ一覧に出る「各記事の最初の画像」を集める */
async function listingImages() {
	const mds = (await walk(CONTENT)).filter((p) => p.endsWith('.md'));
	const urls = new Set();
	for (const f of mds) {
		const t = await readFile(f, 'utf-8');
		const fm = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(t);
		if (!fm) continue;
		const [, meta, body] = fm;
		if (/^kind:/m.test(meta) && !/^kind:\s*post\s*$/m.test(meta)) continue;
		const m = /!\[[^\]]*\]\(((?:https?:\/\/|\/)[^)]+)\)/.exec(body);
		const cover = /^coverImage:\s*["']?(\S+?)["']?\s*$/m.exec(meta);
		const u = m ? m[1] : cover ? cover[1] : null;
		if (u) urls.add(u);
	}
	return [...urls];
}

function toLocal(u) {
	let s = u.startsWith(SITE) ? '/' + u.slice(SITE.length) : u;
	if (!s.startsWith('/')) return null;
	try { s = decodeURIComponent(s); } catch {}
	return path.join(PUBLIC, s.slice(1));
}

async function generateThumbs() {
	await mkdir(THUMBS, { recursive: true });
	const map = {};
	let made = 0, kept = 0;
	for (const u of await listingImages()) {
		const src = toLocal(u);
		if (!src || !existsSync(src)) continue;
		const name = crypto.createHash('sha1').update(u).digest('hex').slice(0, 16) + '.jpg';
		const dest = path.join(THUMBS, name);
		if (await isFresh(src, dest)) kept++;
		else {
			try {
				await sharp(src).resize({ width: THUMB_WIDTH, withoutEnlargement: true })
					.jpeg({ quality: THUMB_QUALITY, progressive: true, mozjpeg: true }).toFile(dest);
				made++;
			} catch { continue; }
		}
		const meta = await sharp(dest).metadata();
		map[u] = { src: `/thumbs/${name}`, w: meta.width, h: meta.height };
	}
	await mkdir(path.join(ROOT, 'src/data'), { recursive: true });
	await writeFile(path.join(ROOT, 'src/data/thumbs.json'), JSON.stringify(map, null, 1) + '\n');
	console.log(`[optimize-images] 一覧サムネイル: 生成${made} / 既存${kept} / 合計${Object.keys(map).length}`);
}

await generateThumbs();
await generateWebp();
