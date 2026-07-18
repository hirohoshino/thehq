// POST /api/admin/status — 空室状況の更新
// body: {"vacantRooms":["303","408"],"note":""}
const VALID_ROOMS = ['301','302','303','304','305','406','407','408','409','410'];

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'invalid_json' }), { status: 400 });
  }
  const vacantRooms = (Array.isArray(body.vacantRooms) ? body.vacantRooms : [])
    .filter((r) => VALID_ROOMS.includes(String(r)))
    .map(String);
  const note = (body.note || '').toString().slice(0, 300);
  const status = { vacantRooms, note, updatedAt: new Date().toISOString() };
  await env.STATUS_KV.put('rooms_status', JSON.stringify(status));
  return new Response(JSON.stringify({ ok: true, status }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
