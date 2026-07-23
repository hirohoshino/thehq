// 家賃・共益費の単一データソース(rooms.json)から表示用の値を算出する共通ヘルパー。
// .astro 側の数値表示はすべてここ経由にすることで、rooms.json を1箇所直せば全表示が揃う。
// (Markdown 側の数値は plugins/remark-pricing.mjs がビルド時にトークン置換する)
import data from './rooms.json';

const fmt = (n) => Number(n).toLocaleString('en-US'); // 39000 -> "39,000"
const yen = (n) => '¥' + fmt(n);

export const rents = data.rents;
export const commonFee = data.commonFee;
export const asOf = data.asOf;

const values = Object.values(data.rents).map(Number);
export const minRent = Math.min(...values);
export const maxRent = Math.max(...values);

export const minRentYen = yen(minRent);          // "¥39,000"
export const maxRentYen = yen(maxRent);          // "¥47,000"
export const commonFeeYen = yen(commonFee);      // "¥14,000"
export const rentRange = `${yen(minRent)}〜${fmt(maxRent)}`; // "¥39,000〜47,000"

// 家賃+共益費の毎月総額レンジ(神大ページ等)
export const totalMin = minRent + commonFee;
export const totalMax = maxRent + commonFee;
export const totalRange = `${yen(totalMin)}〜${yen(totalMax)}`; // "¥53,000〜¥61,000"

// "5万円台" / "5〜6万円台" のような万円台バンド表記
function manBand(min, max) {
  const b = (n) => Math.floor(n / 10000);
  const lo = b(min), hi = b(max);
  return lo === hi ? `${lo}万円台` : `${lo}〜${hi}万円台`;
}
export const monthlyBand = manBand(totalMin, totalMax); // "5〜6万円台"
