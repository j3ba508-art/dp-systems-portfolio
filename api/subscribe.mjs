// Vercel serverless function: POST /api/subscribe
// Saves the email to Supabase (table dp_leads) and, if configured, also adds it to MailerLite.
// Uses only the built-in fetch (Node 18+), so there is nothing to install.
//
// Environment variables (set them in Vercel, never in the page):
//   SUPABASE_URL                 e.g. https://abcdxyz.supabase.co
//   SUPABASE_KEY                 the project's public "anon" key. The SQL script limits this key
//                                to adding rows to dp_leads, so no secret key is needed.
//                                (SUPABASE_SERVICE_ROLE_KEY is also accepted as a fallback.)
//   MAILERLITE_API_KEY           optional; if missing, the email-service step is skipped
//   MAILERLITE_GROUP_ID          optional; the group/segment new subscribers join

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function json(res, status, body) {
  res.status(status).setHeader('Cache-Control', 'no-store');
  return res.json(body);
}

function readBody(req) {
  const b = req.body;
  if (b && typeof b === 'object') return b;
  if (typeof b === 'string') {
    try { return JSON.parse(b); } catch { return {}; }
  }
  return {};
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { ok: false, error: 'Method not allowed' });
  }

  const body = readBody(req);

  // Honeypot: real visitors never see this field. Bots fill it in.
  // Answer "ok" so the bot learns nothing, but save nothing.
  if (body.website) return json(res, 200, { ok: true });

  const email = String(body.email || '').trim().toLowerCase();
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return json(res, 400, { ok: false, error: 'Please enter a valid email address.' });
  }
  if (body.consent !== true) {
    return json(res, 400, { ok: false, error: 'Please tick the box so I know you agree to receive the page and emails.' });
  }

  const { SUPABASE_URL, MAILERLITE_API_KEY, MAILERLITE_GROUP_ID } = process.env;
  const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('subscribe: missing Supabase environment variables');
    return json(res, 500, { ok: false, error: 'The sign-up form is not set up yet. Please try again later.' });
  }

  // 1) Save to Supabase with a plain insert. If the address is already on the list, Postgres
  //    answers 409 (unique violation); that is fine, the visitor still gets the download.
  try {
    const r = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/dp_leads`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ email, source: 'step3-sample', consent: true }),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok && r.status !== 409) {
      console.error('subscribe: Supabase returned', r.status, await r.text().catch(() => ''));
      return json(res, 500, { ok: false, error: 'Something went wrong saving your address. Please try again.' });
    }
  } catch (err) {
    console.error('subscribe: Supabase request failed', err && err.name);
    return json(res, 500, { ok: false, error: 'Something went wrong saving your address. Please try again.' });
  }

  // 2) Add to the email service. Best effort: the visitor still gets the download if this fails,
  //    and the address is already safe in Supabase for a later import.
  if (MAILERLITE_API_KEY) {
    try {
      const payload = { email };
      if (MAILERLITE_GROUP_ID) payload.groups = [MAILERLITE_GROUP_ID];
      const r = await fetch('https://connect.mailerlite.com/api/subscribers', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${MAILERLITE_API_KEY}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
      });
      if (!r.ok) console.error('subscribe: MailerLite returned', r.status, await r.text().catch(() => ''));
    } catch (err) {
      console.error('subscribe: MailerLite request failed', err && err.name);
    }
  }

  return json(res, 200, { ok: true });
}
