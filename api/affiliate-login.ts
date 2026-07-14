/**
 * POST /api/affiliate-login
 * Body: { email: string, password: string, storefront: string }
 *
 * Validates affiliate credentials against WordPress (vp-affiliates plugin)
 * and, on success, sets an httpOnly session cookie carrying the bearer
 * token issued by WP. The token itself never touches client-side JS —
 * affiliate-dashboard.ts reads it back out of the cookie server-side.
 *
 * This portal is multi-tenant (one deployment serves every storefront), so
 * unlike each storefront's own copy of this file there's no fixed
 * STOREFRONT env var here. As of vp-affiliates 1.4.0, an affiliate's email
 * is only unique PER STOREFRONT (not globally) — the same person can now
 * be a separate affiliate account on 1, 2, or 3 brands, each with its own
 * ref code/coupon. That means login has to say which brand it's for; the
 * `storefront` route param (the login page they're on) is what disambig-
 * uates which of that email's rows to check. The affiliate's real storefront
 * still comes back on the response so the dashboard themes correctly even
 * if they clicked into the wrong brand's login link.
 *
 * Requires the vp-affiliates plugin endpoint POST /vp-affiliates/v1/auth/login.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Strip any trailing slash — a WC_URL like "https://db.example.com/" would
// otherwise produce a double slash before "/wp-json/...", which some WP
// hosts/proxies mis-route (404/503) instead of just tolerating it.
const WC_URL = (process.env.WC_URL || '').replace(/\/+$/, '');
const WC_USER = process.env.WC_USER || '';
const WC_APP_PASSWORD = process.env.WC_APP_PASSWORD || '';

const COOKIE_NAME = 'vp_aff_session';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days, matches token lifetime

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, storefront } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  if (!WC_URL) {
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  try {
    const r = await fetch(`${WC_URL}/wp-json/vp-affiliates/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + Buffer.from(`${WC_USER}:${WC_APP_PASSWORD}`).toString('base64'),
      },
      body: JSON.stringify({ email, password, storefront: storefront || 'vintage' }),
      signal: AbortSignal.timeout(10_000),
    });

    const data = await r.json().catch(() => ({}));

    if (!r.ok) {
      return res.status(r.status).json({ error: data.error || 'Invalid email or password.' });
    }

    const isProd = process.env.NODE_ENV === 'production';
    res.setHeader(
      'Set-Cookie',
      `${COOKIE_NAME}=${encodeURIComponent(data.token)}; Max-Age=${COOKIE_MAX_AGE}; Path=/; HttpOnly; SameSite=Lax${isProd ? '; Secure' : ''}`
    );

    // storefront comes back on /dashboard too, but returning it here lets the
    // login page redirect straight to the correctly themed dashboard route
    // without an extra round trip.
    return res.status(200).json({ success: true, name: data.name, ref_code: data.ref_code, storefront: data.storefront });
  } catch (e) {
    console.error('[affiliate-login]', e);
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
}
