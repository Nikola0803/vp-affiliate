/**
 * GET /api/affiliate-dashboard
 *
 * Reads the affiliate's session token out of the httpOnly cookie set by
 * /api/affiliate-login, forwards it to WordPress (vp-affiliates plugin) as a
 * bearer token, and returns the affiliate's stats — including which
 * storefront they belong to, which the frontend uses as the source of truth
 * for which theme to render.
 *
 * Requires the vp-affiliates plugin endpoint GET /vp-affiliates/v1/dashboard.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Strip any trailing slash — a WC_URL like "https://db.example.com/" would
// otherwise produce a double slash before "/wp-json/...", which some WP
// hosts/proxies mis-route (404/503) instead of just tolerating it.
const WC_URL = (process.env.WC_URL || '').replace(/\/+$/, '');
const COOKIE_NAME = 'vp_aff_session';

function readCookie(header: string | undefined, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = readCookie(req.headers.cookie, COOKIE_NAME);
  if (!token) {
    return res.status(401).json({ error: 'Not logged in.' });
  }
  if (!WC_URL) {
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  try {
    const r = await fetch(`${WC_URL}/wp-json/vp-affiliates/v1/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10_000),
    });

    const data = await r.json().catch(() => ({}));

    if (!r.ok) {
      return res.status(r.status).json({ error: data.error || 'Failed to load dashboard.' });
    }

    return res.status(200).json(data);
  } catch (e) {
    console.error('[affiliate-dashboard]', e);
    return res.status(500).json({ error: 'Failed to load dashboard.' });
  }
}
