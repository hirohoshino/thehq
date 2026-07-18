// POST /api/waitlist — 空き待ち登録(公開API)
// D1テーブル waitlist に保存。email重複はUPSERT。honeypot("website")でスパム排除。
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'invalid_json' }, 400);
  }

  // honeypot: 人間には見えないフィールドに値があればbot
  if (body.website) return json({ ok: true }); // botには成功を装う

  const name = (body.name || '').trim().slice(0, 100);
  const email = (body.email || '').trim().slice(0, 200).toLowerCase();
  const desired = (body.desired || '').trim().slice(0, 100);
  const note = (body.note || '').trim().slice(0, 1000);

  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ ok: false, error: 'invalid_input' }, 400);
  }

  const token = crypto.randomUUID();
  const now = new Date().toISOString();

  try {
    await env.DB.prepare(
      `INSERT INTO waitlist (name, email, desired_time, note, token, status, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, 'active', ?6)
       ON CONFLICT(email) DO UPDATE SET
         name = excluded.name,
         desired_time = excluded.desired_time,
         note = excluded.note,
         status = 'active'`
    ).bind(name, email, desired, note, token, now).run();
  } catch (e) {
    return json({ ok: false, error: 'db_error' }, 500);
  }

  // オーナーへ新規登録通知(失敗しても登録自体は成功扱い)
  if (env.RESEND_API_KEY && env.OWNER_EMAIL) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: env.MAIL_FROM || 'The Headquarters Kobe <onboarding@resend.dev>',
          to: [env.OWNER_EMAIL],
          subject: `【空き待ち登録】${name} さん`,
          text: `新しい空き待ち登録がありました。\n\nお名前: ${name}\nメール: ${email}\n希望時期: ${desired || '未記入'}\n備考: ${note || 'なし'}\n登録日時: ${now}\n\n管理ページ: https://theheadquarters.jp/admin/`,
        }),
      });
    } catch (e) { /* ignore */ }
  }

  return json({ ok: true });
}
