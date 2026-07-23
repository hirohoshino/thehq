// /api/admin/rent — 家賃・共益費の取得(GET)と更新(POST)
// POST は GitHub Contents API で src/data/rooms.json をコミット → Cloudflare Pages が自動再ビルド → サイト反映。
// 認証は functions/api/admin/_middleware.js (Authorization: Bearer <ADMIN_PASSWORD>)。
// 必要な環境変数: GITHUB_TOKEN(thehqリポジトリへの Contents: Read/Write 権限を持つ fine-grained PAT)
const OWNER = 'hirohoshino';
const REPO = 'thehq';
const BRANCH = 'main';
const PATH = 'src/data/rooms.json';
const VALID_ROOMS = ['301', '302', '303', '304', '305', '406', '407', '408', '409', '410'];
const API = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;

const ghHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github+json',
  'User-Agent': 'thehq-admin',
  'X-GitHub-Api-Version': '2022-11-28',
});

// UTF-8 対応の base64 変換(rooms.json に日本語を含むため atob/btoa を直接使わない)
const b64ToStr = (b64) =>
  new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\n/g, '')), (c) => c.charCodeAt(0)));
const strToB64 = (str) => {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

async function getCurrent(token) {
  const res = await fetch(`${API}?ref=${BRANCH}`, { headers: ghHeaders(token) });
  if (!res.ok) throw new Error(`github_get_${res.status}`);
  const j = await res.json();
  return { data: JSON.parse(b64ToStr(j.content)), sha: j.sha };
}

export async function onRequestGet({ env }) {
  if (!env.GITHUB_TOKEN) return json({ ok: false, error: 'no_github_token' }, 500);
  try {
    const { data, sha } = await getCurrent(env.GITHUB_TOKEN);
    return json({ ok: true, rents: data.rents, commonFee: data.commonFee, asOf: data.asOf, sha });
  } catch (e) {
    return json({ ok: false, error: String(e.message || e) }, 502);
  }
}

export async function onRequestPost({ request, env }) {
  if (!env.GITHUB_TOKEN) return json({ ok: false, error: 'no_github_token' }, 500);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'invalid_json' }, 400);
  }

  // バリデーション(全10室・妥当な範囲)
  const rents = {};
  for (const r of VALID_ROOMS) {
    const v = Math.round(Number(body?.rents?.[r]));
    if (!Number.isFinite(v) || v < 1000 || v > 500000) {
      return json({ ok: false, error: `bad_rent_${r}` }, 400);
    }
    rents[r] = v;
  }
  const commonFee = Math.round(Number(body?.commonFee));
  if (!Number.isFinite(commonFee) || commonFee < 0 || commonFee > 200000) {
    return json({ ok: false, error: 'bad_common_fee' }, 400);
  }

  try {
    // 最新の sha と asOf をサーバー側で取得(楽観ロック)
    const { data: current, sha } = await getCurrent(env.GITHUB_TOKEN);
    const next = { asOf: current.asOf, commonFee, rents };
    const content = JSON.stringify(next, null, 2) + '\n';

    const put = await fetch(API, {
      method: 'PUT',
      headers: ghHeaders(env.GITHUB_TOKEN),
      body: JSON.stringify({
        message: `家賃改定: 管理ページから更新 (共益費¥${commonFee.toLocaleString('en-US')})`,
        content: strToB64(content),
        sha,
        branch: BRANCH,
        committer: { name: 'THQ Admin', email: 'noreply@anthropic.com' },
      }),
    });
    if (!put.ok) {
      const t = await put.text();
      return json({ ok: false, error: `github_put_${put.status}`, detail: t.slice(0, 300) }, 502);
    }
    const pj = await put.json();
    return json({ ok: true, sha: pj.content?.sha || null, commit: pj.commit?.sha || null });
  } catch (e) {
    return json({ ok: false, error: String(e.message || e) }, 502);
  }
}
