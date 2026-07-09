/**
 * POST /api/affiliate-login
 * Body: { email: string, password: string }
 *
 * Validates affiliate credentials against WordPress (vp-affiliates plugin)
 * and, on success, sets an httpOnly session cookie carrying the bearer
 * token issued by WP. The token itself never touches client-side JS —
 * affiliate-dashboard.ts reads it back out of the cookie server-side.
 *
 * This portal is multi-tenant (one deployment serves every storefront), so
 * unlike each storefront's own copy of this file there's no fixed
 * STOREFRONT env var here — login is by email only (emails are globally
 * unique in wp_vp_affiliates regardless of storefront), and the affiliate's
 * real storefront comes back from /dashboard after login.
 *
 * Requires the vp-affiliates plugin endpoint POST /vp-affiliates/v1/auth/login.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

const WC_URL = process.env.WC_URL || '';
const WC_USER = process.env.WC_USER || '';
const WC_APP_PASSWORD = process.env.WC_APP_PASSWORD || '';

const COOKIE_NAME = 'vp_aff_session';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days, matches token lifetime

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body ?? {};
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
      body: JSON.stringify({ email, password }),
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
