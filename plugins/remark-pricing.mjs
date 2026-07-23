// ビルド時に Markdown 内の価格トークンを src/data/rooms.json の値へ置換する remark プラグイン。
// 対応トークン:
//   %RENT_301% 〜 %RENT_410%  … 各室の賃料
//   %COMMON_FEE%              … 共益費
//   %RENT_MIN% / %RENT_MAX%   … 賃料レンジの下限/上限
// これにより、賃料・共益費は rooms.json を1箇所編集すれば Markdown 側も自動で最新化される。
import { visit } from 'unist-util-visit';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const dataUrl = new URL('../src/data/rooms.json', import.meta.url);

export default function remarkPricing() {
  return (tree) => {
    const data = JSON.parse(readFileSync(fileURLToPath(dataUrl), 'utf-8'));
    const fmt = (n) => Number(n).toLocaleString('en-US');
    const values = Object.values(data.rents).map(Number);
    const min = Math.min(...values);
    const max = Math.max(...values);

    const map = {
      '%COMMON_FEE%': fmt(data.commonFee),
      '%RENT_MIN%': fmt(min),
      '%RENT_MAX%': fmt(max),
    };
    for (const [no, v] of Object.entries(data.rents)) {
      map[`%RENT_${no}%`] = fmt(v);
    }

    const re = /%RENT_\d{3}%|%COMMON_FEE%|%RENT_MIN%|%RENT_MAX%/g;
    visit(tree, 'text', (node) => {
      if (node.value && node.value.includes('%')) {
        node.value = node.value.replace(re, (m) => (m in map ? map[m] : m));
      }
    });
  };
}
