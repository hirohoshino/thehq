import re
import sys
import os
import xml.etree.ElementTree as ET
from datetime import datetime

NS = {
  "content": "http://purl.org/rss/1.0/modules/content/",
  "wp": "http://wordpress.org/export/1.2/",
  "dc": "http://purl.org/dc/elements/1.1/",
}

def slugify(s: str) -> str:
  s = s.strip().lower()
  s = re.sub(r"\s+", "-", s)
  s = re.sub(r"[^a-z0-9\-_.]", "", s)
  s = re.sub(r"-{2,}", "-", s).strip("-")
  return s or "untitled"

def first_300_chars_text(html: str) -> str:
  txt = re.sub(r"<[^>]+>", "", html or "")
  txt = re.sub(r"\s+", " ", txt).strip()
  return txt[:160]

def parse_dt(dt: str) -> str:
  dt = (dt or "").strip()
  if not dt:
    return datetime.now().date().isoformat()
  try:
    return datetime.strptime(dt, "%Y-%m-%d %H:%M:%S").date().isoformat()
  except Exception:
    return dt.split(" ")[0]

def main():
  if len(sys.argv) < 2:
    print("Usage: python3 tools/wp_export_to_md.py <wordpress-export.xml>")
    sys.exit(1)

  xml_path = sys.argv[1]
  out_dir = "src/content/blog/imported"
  os.makedirs(out_dir, exist_ok=True)

  tree = ET.parse(xml_path)
  root = tree.getroot()
  channel = root.find("channel")
  if channel is None:
    raise RuntimeError("Invalid XML: channel not found")

  count = 0
  for item in channel.findall("item"):
    post_type = (item.findtext("wp:post_type", default="", namespaces=NS) or "").strip()
    status = (item.findtext("wp:status", default="", namespaces=NS) or "").strip()
    if post_type not in ("post", "page"):
      continue
    if status != "publish":
      continue

    title = (item.findtext("title", default="") or "").strip()
    slug = (item.findtext("wp:post_name", default="", namespaces=NS) or "").strip()
    date = parse_dt(item.findtext("wp:post_date", default="", namespaces=NS))
    html = item.findtext("content:encoded", default="", namespaces=NS) or ""

    if not slug:
      slug = slugify(title)

    desc = first_300_chars_text(html) or "TODO: description"

    filename = f"{slug}.md"
    path = os.path.join(out_dir, filename)
    i = 2
    while os.path.exists(path):
      filename = f"{slug}-{i}.md"
      path = os.path.join(out_dir, filename)
      i += 1

    md = []
    md.append("---")
    safe_title = title.replace('"', '\\"')
    safe_desc = desc.replace('"', '\\"')
    md.append(f'title: "{safe_title}"')
    md.append(f'description: "{safe_desc}"')
    md.append(f"pubDate: {date}")
    md.append("---")
    md.append("")
    md.append(html.strip())
    md.append("")

    with open(path, "w", encoding="utf-8") as f:
      f.write("\n".join(md))

    count += 1

  print(f"Done. Exported {count} posts/pages to {out_dir}/")

if __name__ == "__main__":
  main()
