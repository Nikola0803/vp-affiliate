/**
 * POST /api/affiliate-payout-request
 *
 * Affiliate asks to cash out their confirmed, unpaid balance. WordPress
 * enforces the storefront's minimum payout and that payout info is on file;
 * this proxy just forwards the bearer token and relays the result.
 *
 * Requires the vp-affiliates plugin endpoint POST /vp-affiliates/v1/payout-request.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Force https and strip trailing slashes. ROOT CAUSE 2026-07-20: the
// WC_URL env var was set to http:// — and plain-HTTP db.vintagepeptides.com
// serves a STALE WordPress with an old vp-affiliates plugin missing the
// /auth/login and /register routes (rest_no_route 404), while https serves
// the real, current site. Every "login/signup 404" traced back to this.
// Forcing https here makes the scheme mistake impossible to repeat.
const WC_URL = (process.env.WC_URL || '').replace(/\/+$/, '').replace(/^http:\/\//i, 'https://');
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
  if (req.method !== 'POST') {
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
    const r = await fetch(`${WC_URL}/wp-json/vp-affiliates/v1/payout-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(10_000),
    });

    const data = await r.json().catch(() => ({}));

    if (!r.ok) {
      return res.status(r.status).json({ error: data.error || 'Failed to request payout.' });
    }

    return res.status(200).json(data);
  } catch (e) {
    console.error('[affiliate-payout-request]', e);
    return res.status(500).json({ error: 'Failed to request payout.' });
  }
}
