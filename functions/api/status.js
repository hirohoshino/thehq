// GET /api/status — 空室状況の取得(公開API)
// KVキー "rooms_status" に {"vacantRooms":["303"],"note":"","updatedAt":"..."} を保持
const DEFAULT_STATUS = { vacantRooms: [], note: '', updatedAt: null };

export async function onRequestGet({ env }) {
  let status = DEFAULT_STATUS;
  try {
    const raw = await env.STATUS_KV.get('rooms_status');
    if (raw) status = { ...DEFAULT_STATUS, ...JSON.parse(raw) };
  } catch (e) {
    // KV未設定でも既定値(満室扱い)を返す
  }
  return new Response(JSON.stringify(status), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
