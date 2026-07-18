// GET /api/admin/waitlist — 空き待ちリスト一覧
export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    `SELECT id, name, email, desired_time, note, status, created_at, notified_at
     FROM waitlist ORDER BY created_at DESC`
  ).all();
  return new Response(JSON.stringify({ ok: true, entries: results }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
