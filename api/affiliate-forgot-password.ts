/**
 * POST /api/affiliate-forgot-password
 * Body: { email: string, storefront: string }
 *
 * Requests a password reset email. Always returns a generic success message
 * regardless of whether the account exists (avoids leaking which emails are
 * registered) — mirrors what the WP plugin endpoint itself does.
 *
 * Passes along this portal's own origin as `reset_url_base` so the plugin
 * (which has no fixed notion of "the" portal domain — one shared backend
 * serves every storefront/preview deployment) can build a working reset link.
 *
 * NOTE: no WC_USER/WC_APP_PASSWORD Basic Auth — public unauthenticated WP
 * route (`permission_callback` => `__return_true`). See affiliate-login.ts.
 *
 * Requires the vp-affiliates plugin endpoint POST /vp-affiliates/v1/auth/forgot-password.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

const WC_URL = (process.env.WC_URL || '').replace(/\/+$/, '');

const GENERIC_MESSAGE = "If an affiliate account exists for that email, we've sent a password reset link.";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, storefront } = req.body ?? {};
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }
  if (!WC_URL) {
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
  const host = req.headers.host;
  const resetUrlBase = `${proto}://${host}`;

  try {
    // Browser-like headers — same reason as affiliate-authenticate.ts: the
    // WP host's edge rule 404s bot-looking server-to-server POSTs to
    // auth-ish endpoints. Critical here because this route swallows
    // upstream errors on purpose — a blocked request means reset emails
    // silently never send while the UI still says "check your email".
    const r = await fetch(`${WC_URL}/wp-json/vp-affiliates/v1/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'Origin': `https://${req.headers.host || 'affiliate.vintagepeptides.com'}`,
        'Referer': `https://${req.headers.host || 'affiliate.vintagepeptides.com'}/`,
      },
      body: JSON.stringify({ email, storefront: storefront || 'vintage', reset_url_base: resetUrlBase }),
      signal: AbortSignal.timeout(10_000),
    });

    // Even if the upstream call itself fails, don't leak that to the client —
    // still say "check your email" so we don't reveal account existence or
    // expose backend connectivity issues to a public, unauthenticated form.
    // (Do log a non-ok upstream response server-side so a real outage is
    // still visible in Vercel logs, even though the user never sees it.)
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      console.error('[affiliate-forgot-password] upstream error', r.status, data);
    }
    return res.status(200).json({ success: true, message: GENERIC_MESSAGE });
  } catch (e) {
    console.error('[affiliate-forgot-password]', e);
    return res.status(200).json({ success: true, message: GENERIC_MESSAGE });
  }
}
