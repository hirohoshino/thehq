import fs from "node:fs";
import path from "node:path";

const BASE = "https://theheadquarters.jp";
const PER_PAGE = 100; // WPは上限100が多い
const OUT_DIR = "tools/wp_dump";

function stripHtml(html = "") {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": "thehq-migrator/1.0" } });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} for ${url}\n${txt.slice(0, 300)}`);
  }
  return res.json();
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  let page = 1;
  let all = [];
  for (;;) {
    const url = `${BASE}/wp-json/wp/v2/posts?per_page=${PER_PAGE}&page=${page}&_embed=1`;
    console.log("GET", url);
    const items = await fetchJson(url);
    if (!Array.isArray(items) || items.length === 0) break;
    all.push(...items);
    if (items.length < PER_PAGE) break;
    page += 1;
  }

  // 最小限の情報に整形して保存
  const slim = all.map((p) => {
    const title = p?.title?.rendered ?? "";
    const html = p?.content?.rendered ?? "";
    const date = p?.date ?? "";
    const slug = p?.slug ?? "";
    const excerpt = stripHtml(p?.excerpt?.rendered ?? "").slice(0, 200);
    const featured = p?._embedded?.["wp:featuredmedia"]?.[0]?.source_url ?? null;
    const categories = p?._embedded?.["wp:term"]?.[0]?.map((t) => t.name) ?? [];
    const tags = p?._embedded?.["wp:term"]?.[1]?.map((t) => t.name) ?? [];

    return { id: p.id, slug, date, title, html, excerpt, featured, categories, tags };
  });

  const outPath = path.join(OUT_DIR, "posts.json");
  fs.writeFileSync(outPath, JSON.stringify(slim, null, 2), "utf-8");
  console.log(`Saved ${slim.length} posts to ${outPath}`);
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
