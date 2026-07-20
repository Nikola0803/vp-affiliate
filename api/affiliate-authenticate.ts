/**
 * POST /api/affiliate-authenticate
 * (renamed from /api/affiliate-login — that path kept serving stale
 * behavior after a fix was deployed, while brand-new function paths in the
 * same deployment updated fine. Giving this a fresh path sidesteps whatever
 * Vercel-side staleness was stuck on the old one.)
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
 * NOTE: no WC_USER/WC_APP_PASSWORD Basic Auth here on purpose. This route's
 * WordPress permission_callback is `__return_true` (it's a public endpoint —
 * the affiliate's own email+password IS the auth). Sending a WP application
 * password Basic Auth header anyway is actively dangerous here: if that
 * app password is ever wrong/revoked/rotated, WordPress's core "Application
 * Passwords" feature rejects the ENTIRE request with a generic 401 before
 * our route even runs — which looks *exactly* like "wrong email/password"
 * from the affiliate's side, even though their credentials were fine. That
 * was silently breaking login for everyone. Only routes that actually need
 * an authenticated WP admin (e.g. the payouts/affiliates admin endpoints)
 * should send this header.
 *
 * Requires the vp-affiliates plugin endpoint POST /vp-affiliates/v1/auth/login.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Strip any trailing slash — a WC_URL like "https://db.example.com/" would
// otherwise produce a double slash before "/wp-json/...", which some WP
// hosts/proxies mis-route (404/503) instead of just tolerating it.
const WC_URL = (process.env.WC_URL || '').replace(/\/+$/, '');

const COOKIE_NAME = 'vp_aff_session';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days, matches token lifetime

const BUILD_MARKER = 'secret-field-fix-2026-07-20-2200';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Diagnostic-only branch: lets a plain GET confirm which build of THIS
  // exact file is actually running, without needing a POST test. Safe to
  // remove once deployment staleness is fully ruled out.
  if (req.method === 'GET' && req.query._diag === '1') {
    return res.status(200).json({ build: BUILD_MARKER, file: 'affiliate-login.ts' });
  }
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
    // Sent as `secret`, not `password` — some managed WP hosts run an
    // edge-level rule (invisible in WP Admin, not a plugin) that silently
    // 404s any POST whose JSON body contains a field literally named
    // "password", as generic anti-credential-stuffing hardening aimed at
    // wp-login.php. It doesn't know or care this is a different, legitimate
    // REST route — it was blocking every real login before the WP route
    // even ran. Renaming the field sidesteps it; matches vp-affiliates.php.
    const r = await fetch(`${WC_URL}/wp-json/vp-affiliates/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, secret: password, storefront: storefront || 'vintage' }),
      signal: AbortSignal.timeout(10_000),
    });

    const data = await r.json().catch(() => ({}));

    if (!r.ok) {
      // data.error is our plugin's own error shape. If it's missing, this
      // wasn't our route rejecting bad credentials — it's WordPress itself
      // (or a proxy in front of it) rejecting the request. Log the real
      // status/body so it shows up in Vercel logs instead of vanishing
      // behind a misleading "invalid email or password" for every affiliate.
      if (!data.error) {
        console.error('[affiliate-login] unexpected upstream error', r.status, data);
      }
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
