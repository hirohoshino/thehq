// GET/POST /api/admin/bbq — BBQ LP(/bbq/)の公開スイッチ
// 認証は functions/api/admin/_middleware.js (Bearer ADMIN_PASSWORD) が担当
// KVキー: bbq_lp {"enabled":bool,"indexable":bool,"suspendMessage":"","updatedAt":"..."}

const KEY = 'bbq_lp';
const DEFAULT_STATE = { enabled: false, indexable: false, suspendMessage: '', updatedAt: null };

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

export async function onRequestGet({ env }) {
  let state = DEFAULT_STATE;
  try {
    const raw = await env.STATUS_KV.get(KEY);
    if (raw) state = { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch (e) {
    return json({ ok: false, error: 'kv_unavailable' }, 500);
  }
  return json({ ok: true, state });
}

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'invalid_json' }, 400);
  }

  if (typeof body.enabled !== 'boolean') return json({ ok: false, error: 'enabled_required' }, 400);

  const state = {
    enabled: body.enabled,
    indexable: body.indexable === true,
    suspendMessage: String(body.suspendMessage || '').slice(0, 400),
    updatedAt: new Date().toISOString(),
  };

  try {
    await env.STATUS_KV.put(KEY, JSON.stringify(state));
  } catch (e) {
    return json({ ok: false, error: 'kv_write_failed' }, 500);
  }
  return json({ ok: true, state });
}
