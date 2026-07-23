/**
 * POST /api/affiliate-coupon-code
 * Body: { code: string }
 *
 * Lets an approved affiliate set or change their own referral/coupon code
 * (always editable — see 2026-07-23 feature request). Proxies to the
 * vp-affiliates plugin endpoint POST /vp-affiliates/v1/account/coupon-code,
 * which keeps ref_code and coupon_code in sync and renames the underlying
 * real WooCommerce coupon in place.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Force https and strip trailing slashes — see affiliate-payout-info.ts for
// why (the http:// scheme mistake serves a stale WordPress instance).
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

  const { code } = req.body ?? {};
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'A code is required.' });
  }

  try {
    const r = await fetch(`${WC_URL}/wp-json/vp-affiliates/v1/account/coupon-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ code }),
      signal: AbortSignal.timeout(10_000),
    });

    const data = await r.json().catch(() => ({}));

    if (!r.ok) {
      return res.status(r.status).json({ error: data.error || 'Failed to update your code.' });
    }

    return res.status(200).json({ success: true, ref_code: data.ref_code, coupon_code: data.coupon_code });
  } catch (e) {
    console.error('[affiliate-coupon-code]', e);
    return res.status(500).json({ error: 'Failed to update your code.' });
  }
}
