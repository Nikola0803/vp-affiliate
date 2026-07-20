/**
 * POST /api/affiliate-signup
 * (renamed from /api/affiliate-register — same reason as
 * affiliate-authenticate.ts: a fresh function path to sidestep Vercel-side
 * staleness that was stuck on the old one.)
 * Body: { name: string, email: string, password: string, storefront: string }
 *
 * Public self-signup proxy. New accounts land as 'pending' in WordPress and
 * can't log in until an admin approves them (WP Admin → Affiliates →
 * Pending Approval). No cookie is set here — registration doesn't log you
 * in, it just queues the request.
 *
 * NOTE: no WC_USER/WC_APP_PASSWORD Basic Auth here — this is a public,
 * unauthenticated WP route (`permission_callback` => `__return_true`). A bad
 * app-password env var would otherwise make WordPress 401 every request
 * before it even reaches the plugin, which shows up client-side as a
 * generic "registration failed" for every signup. See affiliate-login.ts
 * for the full explanation.
 *
 * Requires the vp-affiliates plugin endpoint POST /vp-affiliates/v1/register.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

const WC_URL = (process.env.WC_URL || '').replace(/\/+$/, '');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, password, storefront } = req.body ?? {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }
  if (!WC_URL) {
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  try {
    // Sent as `secret`, not `password` — see affiliate-login.ts for why
    // (some hosts silently 404 any POST body containing a literal
    // "password" field, independent of any WP plugin).
    // Browser-like headers — same reason as affiliate-authenticate.ts: the
    // WP host's edge rule 404s bot-looking server-to-server POSTs to
    // auth-ish endpoints (proven via side-by-side browser vs Vercel test).
    const r = await fetch(`${WC_URL}/wp-json/vp-affiliates/v1/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'Origin': `https://${req.headers.host || 'affiliate.vintagepeptides.com'}`,
        'Referer': `https://${req.headers.host || 'affiliate.vintagepeptides.com'}/`,
      },
      body: JSON.stringify({ name, email, secret: password, storefront }),
      signal: AbortSignal.timeout(10_000),
    });

    const data = await r.json().catch(() => ({}));

    if (!r.ok) {
      if (!data.error) {
        console.error('[affiliate-register] unexpected upstream error', r.status, data);
      }
      return res.status(r.status).json({ error: data.error || 'Registration failed.' });
    }

    return res.status(200).json({ success: true, status: data.status || 'pending' });
  } catch (e) {
    console.error('[affiliate-register]', e);
    return res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
}
