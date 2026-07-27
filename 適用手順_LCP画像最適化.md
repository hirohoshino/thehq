# HQサイト LCP改善パッチ 適用手順

対象: `~/thehq`（Astro / Cloudflare Pages）
目的: モバイル LCP 11.1秒 → 2〜3秒台。Google広告の品質スコア「LPの利便性: 平均より下」の解消。

## 1. 適用

```bash
cd ~/thehq
git apply --stat  ~/Downloads/HQ_LCP画像最適化.patch   # 内容確認（任意）
git apply         ~/Downloads/HQ_LCP画像最適化.patch
```

## 2. ビルドして確認

```bash
npm run build          # optimize-images.mjs が先に走り、幅違いWebPを生成する
npm run preview        # http://localhost:4321 で表示崩れがないか目視
```

確認ポイント:
- トップのヒーロー画像が今までどおり表示される
- 「最新ブログ」3枚のサムネイルが表示される
- Instagram 3枚が正方形で表示される
- `/en/` も同様

## 3. コミットとデプロイ

```bash
git add -A
git commit -m "画像最適化: トップのLCPを改善（幅違いWebP・一覧サムネ・遅延読込）"
git push origin main
```

Cloudflare Pages が自動ビルド。1〜2分で反映。

## 4. 効果測定

デプロイ後に PageSpeed Insights（モバイル）で再測定:
https://pagespeed.web.dev/analysis?url=https%3A%2F%2Ftheheadquarters.jp%2F&form_factor=mobile

- LCP が 11.1秒 → 2〜3秒台に落ちていること
- 画像の転送量が 1,606 KiB → 200〜300 KiB 程度に落ちていること

## 変更内容

| ファイル | 変更 |
|---|---|
| `scripts/optimize-images.mjs` | 固定画像（hero・insta-1〜3）から表示サイズに合わせた幅違いWebPを生成し、対応表を `src/data/site-images.json` に出力する処理を追加 |
| `src/data/site-images.mjs` | 新規。対応表を読んで `<picture>` 用のsrcsetと縦横サイズを返すヘルパー。未生成時は元のJPEGにフォールバック |
| `src/pages/index.astro` | ヒーローを`<picture>`化＋`fetchpriority="high"`＋preload／ブログカードを原寸から一覧サムネイル(500px)へ／Instagramを幅違いWebP＋遅延読込／全画像にwidth・height付与 |
| `src/pages/en/index.astro` | 同上（ヒーローとInstagram） |
| `.gitignore` | 生成物 `src/data/site-images.json` を追加 |

## なぜ効くか

PageSpeedの実測では、トップページの画像転送量が 1,606 KiB、うち 1,441 KiB（約90%）が削減可能だった。
内訳の中心は次の2つ:

- Instagram写真: 161×161pxの枠に **1080×1080pxの原寸**（1枚346 KiB）を流していた
- ブログサムネイル: 表示525×700に対し1200×720の原寸（1枚457 KiB）。`/blog/` では500px版に差し替え済みだったが、**トップページだけ未対応だった**

hero.jpg 自体は87 KiBと軽く、遅延の原因は「他の重い画像と帯域を奪い合っていたこと」＋「LCP画像に優先度指定がなかったこと」。
このパッチはその両方を潰す。

## 検証済みのこと

- 修正後の3ファイルを Astro コンパイラで構文チェック → OK
- 生成スクリプトを実画像相当のサイズで実行 → 幅違いWebPと対応表が正しく生成されることを確認
- 実際に Astro build を通し、出力HTMLが意図どおり（preload / source srcset / width・height / fetchpriority / loading=lazy）であることを確認
- 対応表が空の場合のフォールバック（元のJPEGを出す）も確認済み
