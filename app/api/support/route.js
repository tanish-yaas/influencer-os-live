// app/api/support/route.js
// Receives a support request from the in-app "Contact support" form and emails
// it to the YAAS team. Uses Resend (https://resend.com) for delivery.
//
// This route is OPTIONAL. If it isn't deployed or the API key isn't set, the
// app automatically falls back to opening the user's email client (mailto),
// so "Contact support" always works either way.
//
// To enable silent server-side sending:
//   1. Create a free account at resend.com (sign up with tanish@yaas.studio so
//      Resend lets you send to that address without verifying a domain).
//   2. Create an API key and add it in Vercel -> Settings -> Env Variables as
//      RESEND_API_KEY.
//   3. (Optional) Set SUPPORT_TO (defaults to tanish@yaas.studio) and
//      SUPPORT_FROM (defaults to onboarding@resend.dev, which works without a
//      verified domain). To send from support@yaas.studio instead, verify the
//      yaas.studio domain in Resend first, then set SUPPORT_FROM to that.

export const maxDuration = 30;

export async function POST(request) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.SUPPORT_TO || 'tanish@yaas.studio';
  const from = process.env.SUPPORT_FROM || 'YAAS OS <onboarding@resend.dev>';

  if (!apiKey) {
    // Not configured: tell the client so it can fall back to mailto.
    return Response.json({ ok: false, skipped: true, reason: 'Email sending is not configured (set RESEND_API_KEY).' });
  }

  let body;
  try { body = await request.json(); } catch { return Response.json({ ok: false, error: 'Invalid body' }, { status: 400 }); }

  const message = (body.message || '').toString().trim();
  if (!message) return Response.json({ ok: false, error: 'Empty message' }, { status: 400 });

  const fromName = (body.fromName || 'A YAAS user').toString();
  const fromEmail = (body.fromEmail || '').toString();
  const category = (body.category || 'Support').toString();
  const subject = (body.subject || `[YAAS OS] ${category}`).toString();
  const context = (body.context || '').toString();

  const text = `${message}\n${context}`;
  const html = `<div style="font-family:system-ui,Arial,sans-serif;font-size:14px;color:#111">
    <p style="white-space:pre-wrap;margin:0 0 16px">${escapeHtml(message)}</p>
    <hr style="border:none;border-top:1px solid #eee;margin:16px 0"/>
    <table style="font-size:12px;color:#666">
      <tr><td style="padding:2px 8px 2px 0">Type</td><td>${escapeHtml(category)}</td></tr>
      <tr><td style="padding:2px 8px 2px 0">From</td><td>${escapeHtml(fromName)} &lt;${escapeHtml(fromEmail)}&gt;</td></tr>
    </table>
  </div>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        text,
        html,
        reply_to: fromEmail || undefined
      })
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j && j.message ? j.message : `Resend returned ${res.status}`);
    return Response.json({ ok: true, id: j.id });
  } catch (e) {
    console.error('support route error:', e?.message || e);
    return Response.json({ ok: false, error: e?.message || 'send failed' });
  }
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}