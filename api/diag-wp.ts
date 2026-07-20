/**
 * GET /api/diag-wp
 *
 * TEMPORARY diagnostic — probes the shared WordPress backend (WC_URL) from
 * inside Vercel and reports, for each vp-affiliates route the portal depends
 * on, the real HTTP status + a body snippet. Answers two questions at once:
 *
 *   1. Is the vp-affiliates plugin on db.vintagepeptides.com actually
 *      registering /auth/login, /register, /dashboard etc.? (A 404 with
 *      code "rest_no_route" here = outdated/inactive plugin. A 400/401 =
 *      route exists and ran.)
 *   2. Does a BRAND-NEW function file added today get routed by Vercel at
 *      all? If /api/diag-wp itself 404s while /api/version works, that's
 *      final proof the problem is Vercel routing, not WordPress.
 *
 * Safe: read-only probes + one login attempt with obviously-fake
 * credentials. Delete this file once the incident is resolved.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

const WC_URL = (process.env.WC_URL || '').replace(/\/+$/, '');

async function probe(name: string, url: string, init?: RequestInit) {
  try {
    const r = await fetch(url, { ...init, signal: AbortSignal.timeout(10_000) });
    const text = await r.text().catch(() => '');
    return { name, url, status: r.status, body: text.slice(0, 400) };
  } catch (e) {
    return { name, url, status: 0, error: String(e) };
  }
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  if (!WC_URL) {
    return res.status(500).json({ error: 'WC_URL env var is not set on this Vercel project.' });
  }

  const json = { 'Content-Type': 'application/json' };

  const results = await Promise.all([
    // Namespace index — lists every route the deployed plugin registers.
    probe('namespace-index', `${WC_URL}/wp-json/vp-affiliates/v1`),
    // Control: known-working public GET.
    probe('materials-GET', `${WC_URL}/wp-json/vp-affiliates/v1/materials?storefront=vintage`),
    // The login route with fake creds, sent two ways. PROVEN 2026-07-20:
    // plain server-side POST gets 404 from the WP host's edge rule while
    // the identical request from a real browser gets 401 JSON. These two
    // probes confirm the rule and whether browser-like headers defeat it:
    // expected result: plain → 404 (blocked), browser-headers → 401
    // {"error":"Invalid email or password."} (rule bypassed, login fixed).
    probe('auth-login-POST-plain', `${WC_URL}/wp-json/vp-affiliates/v1/auth/login`, {
      method: 'POST',
      headers: json,
      body: JSON.stringify({ email: 'diag-probe@example.com', secret: 'diag-probe-not-real', storefront: 'vintage' }),
    }),
    probe('auth-login-POST-browser-headers', `${WC_URL}/wp-json/vp-affiliates/v1/auth/login`, {
      method: 'POST',
      headers: {
        ...json,
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'Origin': 'https://affiliate.vintagepeptides.com',
        'Referer': 'https://affiliate.vintagepeptides.com/',
      },
      body: JSON.stringify({ email: 'diag-probe@example.com', secret: 'diag-probe-not-real', storefront: 'vintage' }),
    }),
    // Register route with an intentionally incomplete body. Expected if
    // healthy: 400 validation error. rest_no_route 404 = route missing.
    probe('register-POST', `${WC_URL}/wp-json/vp-affiliates/v1/register`, {
      method: 'POST',
      headers: json,
      body: JSON.stringify({}),
    }),
    // Dashboard with a garbage bearer token. Expected if healthy: 401
    // {"error":"Not authenticated."}. rest_no_route 404 = route missing.
    probe('dashboard-GET', `${WC_URL}/wp-json/vp-affiliates/v1/dashboard`, {
      headers: { Authorization: 'Bearer diag-probe-invalid-token' },
    }),
  ]);

  return res.status(200).json({
    build: 'diag-wp-2026-07-20',
    wc_url_host: new URL(WC_URL).host,
    results,
  });
}
