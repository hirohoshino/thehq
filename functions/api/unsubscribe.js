// GET /api/unsubscribe?token=... — 配信停止
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token') || '';
  let ok = false;
  if (token) {
    try {
      const res = await env.DB.prepare(
        `UPDATE waitlist SET status = 'unsubscribed' WHERE token = ?1`
      ).bind(token).run();
      ok = res.meta.changes > 0;
    } catch (e) { /* fallthrough */ }
  }
  const msg = ok
    ? '配信停止が完了しました。今後、空室のお知らせは送信されません。'
    : '無効なリンクです。すでに配信停止済みの可能性があります。';
  return new Response(
    `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>配信停止 | The Headquarters Kobe</title></head><body style="font-family:sans-serif;max-width:600px;margin:4em auto;padding:0 1em;text-align:center"><h1 style="font-size:1.2em">The Headquarters Kobe</h1><p>${msg}</p><p><a href="/">トップページへ</a></p></body></html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}
