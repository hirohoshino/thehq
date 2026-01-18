import fs from "node:fs";
import path from "node:path";
import TurndownService from "turndown";

const SRC = "tools/wp_dump";
const OUT = "src/content/blog/bulk";
fs.mkdirSync(OUT, { recursive: true });

const td = new TurndownService({ headingStyle: "atx" });

function stripHtml(html = "") {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function writeOne({ id, slug, date, title, html, excerpt, kind }) {
  const safeSlug = slug || `item-${id}`;
  const pubDate = (date || "").slice(0, 10) || "2026-01-01";
  const safeTitle = (title || safeSlug).replace(/"/g, '\\"');
  const desc = stripHtml(excerpt || "").slice(0, 160).replace(/"/g, '\\"');
  const body = td.turndown(html || "");

  const fm = [
    "---",
    `title: "${safeTitle}"`,
    `description: "${desc}"`,
    `pubDate: ${pubDate}`,
    `kind: ${kind}`,
    "---",
    "",
  ].join("\n");

  fs.writeFileSync(path.join(OUT, `${safeSlug}.md`), fm + body + "\n", "utf-8");
}

const posts = JSON.parse(fs.readFileSync(path.join(SRC, "posts.json"), "utf-8"));
const pagesRaw = JSON.parse(fs.readFileSync(path.join(SRC, "pages.json"), "utf-8"));

posts.forEach(p => writeOne({
  id: p.id, slug: p.slug, date: p.date, title: p.title, html: p.html, excerpt: p.excerpt, kind: "post"
}));

pagesRaw.forEach(p => writeOne({
  id: p.id,
  slug: p.slug,
  date: p.date,
  title: p.title?.rendered ?? "",
  html: p.content?.rendered ?? "",
  excerpt: p.excerpt?.rendered ?? "",
  kind: "page"
}));

console.log(`Done. Wrote ${posts.length + pagesRaw.length} markdown files to ${OUT}/`);
