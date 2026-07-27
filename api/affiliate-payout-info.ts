/**
 * POST /api/affiliate-payout-info
 *   Body: { payout_method: string, payout_destination: string }
 *   Lets an affiliate save/update where they want withdrawals sent (Zelle,
 *   Cash App, Venmo, or a crypto address). Required before a payout request
 *   can be submitted. Proxies to vp-affiliates/v1/account/payout-info.
 *
 * POST /api/affiliate-payout-info
 *   Body: { code: string }
 *   Lets an affiliate set/change their own referral+coupon code (always
 *   editable). Proxies to vp-affiliates/v1/account/coupon-code.
 *
 *   NOTE 2026-07-23: the coupon-code endpoint used to be its own file,
 *   api/affiliate-coupon-code.ts. Merged in here instead — Vercel's Hobby
 *   plan caps a deployment at 12 serverless functions, and this project was
 *   already sitting exactly at that cap, so adding a 13th file broke the
 *   build ("No more than 12 Serverless Functions..."). Dispatching on body
 *   shape (code vs. payout_method/payout_destination) keeps this one file
 *   doing both jobs. api/affiliate-coupon-code.ts is now excluded via
 *   .vercelignore and kept only for reference.
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

  const body = (req.body ?? {}) as { code?: string; payout_method?: string; payout_destination?: string };

  // Coupon-code flow (body has `code`, not payout fields).
  if (typeof body.code === 'string' && !body.payout_method && !body.payout_destination) {
    try {
      const r = await fetch(`${WC_URL}/wp-json/vp-affiliates/v1/account/coupon-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: body.code }),
        signal: AbortSignal.timeout(10_000),
      });

      const data = await r.json().catch(() => ({}));

      if (!r.ok) {
        return res.status(r.status).json({ error: data.error || 'Failed to update your code.' });
      }

      return res.status(200).json({ success: true, ref_code: data.ref_code, coupon_code: data.coupon_code });
    } catch (e) {
      console.error('[affiliate-payout-info:coupon-code]', e);
      return res.status(500).json({ error: 'Failed to update your code.' });
    }
  }

  // Payout-info flow (existing behavior, unchanged).
  const { payout_method, payout_destination } = body;
  if (!payout_method || !payout_destination) {
    return res.status(400).json({ error: 'Payout method and destination are required.' });
  }

  try {
    const r = await fetch(`${WC_URL}/wp-json/vp-affiliates/v1/account/payout-info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ payout_method, payout_destination }),
      signal: AbortSignal.timeout(10_000),
    });

    const data = await r.json().catch(() => ({}));

    if (!r.ok) {
      return res.status(r.status).json({ error: data.error || 'Failed to save payout info.' });
    }

    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('[affiliate-payout-info]', e);
    return res.status(500).json({ error: 'Failed to save payout info.' });
  }
}
