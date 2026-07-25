// BBQ LPスイッチのミドルウェア/APIの動作検証（デプロイ前のローカルテスト）
import { onRequest } from '../functions/bbq/_middleware.js';
import { onRequestGet, onRequestPost } from '../functions/api/admin/bbq.js';

const store = new Map();
const env = {
  STATUS_KV: {
    get: async (k) => (store.has(k) ? store.get(k) : null),
    put: async (k, v) => void store.set(k, v),
  },
};

const LP_BODY = '<html><body>LP</body></html>';
const nextDoc = async () =>
  new Response(LP_BODY, { status: 200, headers: { 'Content-Type': 'text/html', 'Cache-Control': 'public, max-age=3600' } });
const nextAsset = async () =>
  new Response('JPEGDATA', { status: 200, headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=31536000' } });

const req = (path) => new Request('https://theheadquarters.jp' + path);

let pass = 0, fail = 0;
function check(name, cond, got) {
  if (cond) { pass++; console.log('  ✓', name); }
  else { fail++; console.log('  ✗', name, '→ got:', got); }
}

async function setState(body) {
  const res = await onRequestPost({ request: new Request('https://theheadquarters.jp/api/admin/bbq', { method: 'POST', body: JSON.stringify(body) }), env });
  return res.json();
}

console.log('\n[1] 初期状態（KV未設定）= 非公開にフォールバック');
{
  const r = await onRequest({ request: req('/bbq/'), env, next: nextDoc });
  const html = await r.text();
  check('200で受付停止中ページ', r.status === 200 && html.includes('受付を停止しています'), r.status);
  check('noindexヘッダ', r.headers.get('X-Robots-Tag') === 'noindex, nofollow', r.headers.get('X-Robots-Tag'));
  check('LP本体は出ない', !html.includes('<body>LP</body>'), 'leaked');
  const a = await onRequest({ request: req('/bbq/img/hero-night.jpg'), env, next: nextAsset });
  check('停止中は画像も404', a.status === 404, a.status);
}

console.log('\n[2] 公開ON / 検索エンジンOFF（段階公開フェーズ）');
{
  await setState({ enabled: true, indexable: false });
  const r = await onRequest({ request: req('/bbq/'), env, next: nextDoc });
  check('LPが配信される', (await r.text()).includes('<body>LP</body>'), r.status);
  check('X-Robots-Tag: noindex, follow', r.headers.get('X-Robots-Tag') === 'noindex, follow', r.headers.get('X-Robots-Tag'));
  check('ドキュメントはno-store', /no-store/.test(r.headers.get('Cache-Control')), r.headers.get('Cache-Control'));
  const a = await onRequest({ request: req('/bbq/img/hero-night.jpg'), env, next: nextAsset });
  check('画像は通常配信＋長期キャッシュ維持', a.status === 200 && /max-age=31536000/.test(a.headers.get('Cache-Control')), a.headers.get('Cache-Control'));
}

console.log('\n[3] 公開ON / 検索エンジンON（インデックス解禁）');
{
  await setState({ enabled: true, indexable: true });
  const r = await onRequest({ request: req('/bbq/'), env, next: nextDoc });
  check('noindexヘッダが外れる', r.headers.get('X-Robots-Tag') === null, r.headers.get('X-Robots-Tag'));
  check('LPが配信される', (await r.text()).includes('<body>LP</body>'), r.status);
}

console.log('\n[4] 停止に戻す＋補足メッセージ');
{
  await setState({ enabled: false, indexable: true, suspendMessage: '8月中旬から再開予定です' });
  const r = await onRequest({ request: req('/bbq/'), env, next: nextDoc });
  const html = await r.text();
  check('停止ページに戻る', html.includes('受付を停止しています'), r.status);
  check('補足メッセージが出る', html.includes('8月中旬から再開予定です'), 'missing');
  check('indexable=trueでもnoindex', r.headers.get('X-Robots-Tag') === 'noindex, nofollow', r.headers.get('X-Robots-Tag'));
}

console.log('\n[5] APIのバリデーション');
{
  const bad = await onRequestPost({ request: new Request('https://theheadquarters.jp/api/admin/bbq', { method: 'POST', body: 'not json' }), env });
  check('壊れたJSONは400', bad.status === 400, bad.status);
  const noEnabled = await onRequestPost({ request: new Request('https://theheadquarters.jp/api/admin/bbq', { method: 'POST', body: '{}' }), env });
  check('enabled必須で400', noEnabled.status === 400, noEnabled.status);
  const long = await setState({ enabled: false, suspendMessage: 'あ'.repeat(600) });
  check('メッセージは400字に切り詰め', long.state.suspendMessage.length === 400, long.state.suspendMessage.length);
  const g = await (await onRequestGet({ env })).json();
  check('GETが現在値を返す', g.ok === true && g.state.enabled === false, JSON.stringify(g).slice(0, 80));
}

console.log('\n[6] XSS対策（停止メッセージ）');
{
  await setState({ enabled: false, suspendMessage: '<script>alert(1)</script>' });
  const html = await (await onRequest({ request: req('/bbq/'), env, next: nextDoc })).text();
  check('スクリプトタグがエスケープされる', !html.includes('<script>alert(1)</script>') && html.includes('&lt;script&gt;'), 'NOT ESCAPED');
}

console.log(`\n結果: ${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
