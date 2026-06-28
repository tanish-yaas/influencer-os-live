// app/api/sync-creator-database/route.js
// One-way mirror: app -> Google Sheets for the Creator Database (the rolled-up,
// one-row-per-creator rolodex). POST { headers: [...], rows: [[...], ...] } and
// this overwrites a single tab ("Creator Database") in one spreadsheet.
//
// Required environment variables (Vercel -> Settings -> Env Variables):
//   GOOGLE_SA_EMAIL        - the service account email (same one you already use)
//   GOOGLE_SA_PRIVATE_KEY  - the service account private key (whole BEGIN/END
//                            block; literal \n or real newlines both handled)
//   SHEET_ID_DATABASE      - spreadsheet ID of the Creator Database master sheet
//
// Share the spreadsheet with GOOGLE_SA_EMAIL as an Editor.
// If any env var is missing, this route no-ops so the app never breaks.

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

const TAB = 'Creator Database';
const quoteTab = (tab) => `'${tab.replace(/'/g, "''")}'`;

export async function POST(request) {
  const email = process.env.GOOGLE_SA_EMAIL;
  let key = process.env.GOOGLE_SA_PRIVATE_KEY;
  const sheetId = process.env.SHEET_ID_DATABASE;

  if (!email || !key || !sheetId) {
    return Response.json({ ok: false, skipped: true, reason: 'Creator Database sync is not configured (set SHEET_ID_DATABASE).' });
  }
  key = key.replace(/\\n/g, '\n');

  let body;
  try { body = await request.json(); } catch { return Response.json({ ok: false, error: 'Invalid body' }, { status: 400 }); }
  const headers = Array.isArray(body.headers) ? body.headers : [];
  const rows = Array.isArray(body.rows) ? body.rows : [];

  try {
    const token = await getAccessToken(email, key);
    const auth = { Authorization: `Bearer ${token}` };

    // Ensure the tab exists.
    const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets.properties.title`, { headers: auth });
    const meta = await metaRes.json();
    if (meta.error) throw new Error('Sheet read failed: ' + (meta.error.message || ''));
    const existing = new Set((meta.sheets || []).map(s => s.properties.title));
    if (!existing.has(TAB)) {
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate`, {
        method: 'POST',
        headers: { ...auth, 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests: [{ addSheet: { properties: { title: TAB } } }] })
      });
    }

    // Clear then write.
    const clearRange = encodeURIComponent(`${quoteTab(TAB)}!A:Z`);
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${clearRange}:clear`, { method: 'POST', headers: auth });

    const values = [headers, ...rows];
    const writeRange = encodeURIComponent(`${quoteTab(TAB)}!A1`);
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${writeRange}?valueInputOption=RAW`, {
      method: 'PUT',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values })
    });

    return Response.json({ ok: true, count: rows.length });
  } catch (e) {
    console.error('sync-creator-database error:', e?.message || e);
    return Response.json({ ok: false, error: e?.message || 'sync failed' });
  }
}