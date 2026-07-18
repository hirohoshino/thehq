// POST /api/admin/notify — 空き待ちリストへ一斉メール配信(Resend)
// body: {"subject": "...", "message": "..."} (省略時は既定文面を自動生成)
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export async function onRequestPost({ request, env }) {
  if (!env.RESEND_API_KEY) return json({ ok: false, error: 'resend_not_configured' }, 500);

  let body = {};
  try { body = await request.json(); } catch { /* 既定文面を使う */ }

  // 現在の空室状況を取得して既定文面を作る
  let vacantRooms = [];
  try {
    const raw = await env.STATUS_KV.get('rooms_status');
    if (raw) vacantRooms = JSON.parse(raw).vacantRooms || [];
  } catch (e) { /* ignore */ }

  const roomsText = vacantRooms.length ? vacantRooms.map((r) => `${r}号室`).join('、') : '';
  const subject = (body.subject || '').trim() ||
    `【The Headquarters Kobe】空室が出ました${roomsText ? `(${roomsText})` : ''}`;
  const message = (body.message || '').trim() ||
    `The Headquarters Kobe(神戸・水道筋のシェアハウス)です。\n空き待ちにご登録いただき、ありがとうございます。\n\nこのたび空室が出ましたのでお知らせします。${roomsText ? `\n\n空き部屋: ${roomsText}` : ''}\n\nお部屋の詳細・家賃はこちら:\nhttps://theheadquarters.jp/rooms/\n\n内見のご希望・ご質問はこちらから:\nhttps://theheadquarters.jp/contact/\n\n先着順でのご案内となりますので、ご希望の方はお早めにご連絡ください。`;

  // 配信対象(active)を取得
  const { results } = await env.DB.prepare(
    `SELECT id, name, email, token FROM waitlist WHERE status = 'active'`
  ).all();
  if (!results.length) return json({ ok: true, sent: 0, note: 'no_active_recipients' });

  const from = env.MAIL_FROM || 'The Headquarters Kobe <onboarding@resend.dev>';
  const emails = results.map((r) => ({
    from,
    to: [r.email],
    subject,
    text: `${r.name} 様\n\n${message}\n\n---\n配信停止をご希望の方はこちら:\nhttps://theheadquarters.jp/api/unsubscribe?token=${r.token}`,
  }));

  // Resendバッチ送信(100件/回)
  let sent = 0;
  const errors = [];
  for (let i = 0; i < emails.length; i += 100) {
    const chunk = emails.slice(i, i + 100);
    const res = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chunk),
    });
    if (res.ok) sent += chunk.length;
    else errors.push(await res.text());
  }

  // 送信済み記録
  if (sent > 0) {
    const now = new Date().toISOString();
    await env.DB.prepare(
      `UPDATE waitlist SET notified_at = ?1 WHERE status = 'active'`
    ).bind(now).run();
  }

  return json({ ok: errors.length === 0, sent, total: results.length, errors });
}
