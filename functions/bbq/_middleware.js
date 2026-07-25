// /bbq/* — BBQ LP の公開スイッチ
//
// 管理ページ(/admin)のスイッチで KV の状態を切り替える。再ビルド不要で即時反映。
//   enabled=false          → 「受付停止中」ページを返す(noindex)
//   enabled=true,  indexable=false → LPを返すが X-Robots-Tag: noindex(段階公開フェーズ)
//   enabled=true,  indexable=true  → LPを通常公開(検索エンジンに開放)
//
// KVキー: bbq_lp  {"enabled":false,"indexable":false,"suspendMessage":"","updatedAt":null}

const KEY = 'bbq_lp';
const DEFAULT_STATE = { enabled: false, indexable: false, suspendMessage: '', updatedAt: null };

export async function getBbqState(env) {
  try {
    const raw = await env.STATUS_KV.get(KEY);
    if (raw) return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch (e) {
    // KV未設定でも既定値(非公開)にフォールバック
  }
  return DEFAULT_STATE;
}

export async function onRequest({ request, env, next }) {
  const url = new URL(request.url);
  // 拡張子なし or .html をドキュメント扱い(画像・CSS等はアセット扱い)
  const isDoc = !/\.[a-z0-9]+$/i.test(url.pathname) || /\.html?$/i.test(url.pathname);

  const state = await getBbqState(env);

  if (!state.enabled) {
    if (!isDoc) return new Response('Not Found', { status: 404 });
    return new Response(suspendedHtml(state.suspendMessage), {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, must-revalidate',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    });
  }

  const res = await next();
  if (!isDoc) return res;

  // ドキュメントはキャッシュさせない(スイッチを即時反映させるため)
  const out = new Response(res.body, res);
  out.headers.set('Cache-Control', 'no-store, must-revalidate');
  if (!state.indexable) out.headers.set('X-Robots-Tag', 'noindex, follow');
  return out;
}

function esc(s) {
  return String(s || '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );
}

function suspendedHtml(message) {
  const extra = message
    ? `<p class="note">${esc(message).replace(/\n/g, '<br>')}</p>`
    : '';
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>ただいま受付を停止しています｜天空の貸切バーベキュー場（ザ・テラス水道筋）</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#0c0e11;color:#ece8e1;min-height:100svh;display:flex;align-items:center;
    justify-content:center;padding:32px 22px;line-height:1.9;
    font-family:"Hiragino Sans","Noto Sans JP",system-ui,sans-serif;-webkit-font-smoothing:antialiased}
  .box{max-width:520px;text-align:center}
  .kicker{font-size:11px;letter-spacing:.34em;color:#d7a54a;margin-bottom:22px}
  h1{font-family:"Hiragino Mincho ProN",serif;font-weight:600;
    font-size:clamp(21px,4.4vw,28px);line-height:1.65;letter-spacing:.05em;margin-bottom:22px}
  p{color:#a6abb4;font-size:14.5px;line-height:2.05}
  .note{margin-top:20px;padding:18px 20px;border:1px solid #262b33;border-radius:4px;
    background:#161a20;color:#d8d4cc;font-size:14px;text-align:left}
  .links{margin-top:34px;display:flex;gap:14px;justify-content:center;flex-wrap:wrap}
  a{display:inline-flex;align-items:center;justify-content:center;text-decoration:none;
    padding:13px 26px;border-radius:999px;font-size:13.5px;letter-spacing:.05em;
    border:1px solid rgba(255,255,255,.22);color:#ece8e1;transition:border-color .3s,color .3s}
  a:hover{border-color:#d7a54a;color:#e9c37e}
  .foot{margin-top:36px;font-size:11.5px;color:#767c86;letter-spacing:.04em}
</style>
</head>
<body>
  <div class="box">
    <div class="kicker">TEMPORARILY CLOSED</div>
    <h1>ただいま、屋上BBQの<br>受付を停止しています。</h1>
    <p>ご利用のお申し込みを一時的にお休みしています。<br>再開までしばらくお待ちください。</p>
    ${extra}
    <div class="links">
      <a href="https://www.spacemarket.com/spaces/suidousuji-terrace/" target="_blank" rel="noopener">掲載ページを見る</a>
      <a href="https://theheadquarters.jp/">The Headquarters Kobe</a>
    </div>
    <p class="foot">ザ・テラス水道筋／兵庫県神戸市灘区水道筋3丁目21</p>
  </div>
</body>
</html>`;
}
