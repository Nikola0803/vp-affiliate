/**
 * POST /api/affiliate-payout-info
 * Body: { payout_method: string, payout_destination: string }
 *
 * Lets an affiliate save/update where they want withdrawals sent (Zelle,
 * Cash App, Venmo, or a crypto address). Required before a payout request
 * can be submitted.
 *
 * Requires the vp-affiliates plugin endpoint POST /vp-affiliates/v1/account/payout-info.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

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

  const { payout_method, payout_destination } = req.body ?? {};
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
