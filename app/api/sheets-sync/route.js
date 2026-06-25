// app/api/sheets-sync/route.js
// One-way mirror: app -> Google Sheets. POST a snapshot of all campaigns'
// live + in-talks creators; this writes a tab per campaign into two master
// spreadsheets (one for Live Creators, one for In-Talks).
//
// Required environment variables (set in Vercel -> Settings -> Env Variables):
//   GOOGLE_SA_EMAIL        - the service account email
//   GOOGLE_SA_PRIVATE_KEY  - the service account private key (paste the whole
//                            -----BEGIN PRIVATE KEY----- ... block; newlines
//                            may be stored as literal \n, we handle both)
//   SHEET_ID_LIVE          - spreadsheet ID of the "Live Creators" master sheet
//   SHEET_ID_TALKS         - spreadsheet ID of the "In-Talks" master sheet
//
// Share BOTH spreadsheets with GOOGLE_SA_EMAIL as an Editor.
// If any env var is missing, this route no-ops (so the app never breaks).

import crypto from 'crypto';

export const maxDuration = 60;

const b64url = (buf) => Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function getAccessToken(email, key) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64url(JSON.stringify({
    iss: email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  }));
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(`${header}.${claim}`);
  signer.end();
  const sig = b64url(signer.sign(key));
  const assertion = `${header}.${claim}.${sig}`;
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=${encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer')}&assertion=${assertion}`
  });
  const j = await res.json();
  if (!j.access_token) throw new Error('Token exchange failed: ' + JSON.stringify(j));
  return j.access_token;
}

const sanitizeTab = (name) => (String(name || 'Campaign').replace(/[\[\]\*\?\/\\:]/g, ' ').trim().slice(0, 90) || 'Campaign');
const quoteTab = (tab) => `'${tab.replace(/'/g, "''")}'`;

async function syncSpreadsheet(token, sheetId, entries) {
  const auth = { Authorization: `Bearer ${token}` };
  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets.properties.title`, { headers: auth });
  const meta = await metaRes.json();
  if (meta.error) throw new Error('Sheet read failed: ' + (meta.error.message || ''));
  const existing = new Set((meta.sheets || []).map(s => s.properties.title));

  const toAdd = [];
  for (const e of entries) {
    const t = sanitizeTab(e.campaign);
    if (!existing.has(t)) { toAdd.push({ addSheet: { properties: { title: t } } }); existing.add(t); }
  }
  if (toAdd.length) {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate`, {
      method: 'POST',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: toAdd })
    });
  }

  for (const e of entries) {
    const tab = sanitizeTab(e.campaign);
    const clearRange = encodeURIComponent(`${quoteTab(tab)}!A:Z`);
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${clearRange}:clear`, { method: 'POST', headers: auth });
    const values = [e.headers || [], ...(e.rows || [])];
    const writeRange = encodeURIComponent(`${quoteTab(tab)}!A1`);
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${writeRange}?valueInputOption=RAW`, {
      method: 'PUT',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values })
    });
  }
}

export async function POST(request) {
  const email = process.env.GOOGLE_SA_EMAIL;
  let key = process.env.GOOGLE_SA_PRIVATE_KEY;
  const liveId = process.env.SHEET_ID_LIVE;
  const talksId = process.env.SHEET_ID_TALKS;

  if (!email || !key || !liveId || !talksId) {
    return Response.json({ ok: false, skipped: true, reason: 'Google Sheets sync is not configured.' });
  }
  key = key.replace(/\\n/g, '\n');

  let body;
  try { body = await request.json(); } catch { return Response.json({ ok: false, error: 'Invalid body' }, { status: 400 }); }

  try {
    const token = await getAccessToken(email, key);
    if (Array.isArray(body.live)) await syncSpreadsheet(token, liveId, body.live);
    if (Array.isArray(body.talks)) await syncSpreadsheet(token, talksId, body.talks);
    return Response.json({ ok: true });
  } catch (e) {
    console.error('sheets-sync error:', e?.message || e);
    return Response.json({ ok: false, error: e?.message || 'sync failed' });
  }
}