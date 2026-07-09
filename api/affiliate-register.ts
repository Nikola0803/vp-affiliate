/**
 * POST /api/affiliate-register
 * Body: { name: string, email: string, password: string, storefront: string }
 *
 * Public self-signup proxy. New accounts land as 'pending' in WordPress and
 * can't log in until an admin approves them (WP Admin → Affiliates →
 * Pending Approval). No cookie is set here — registration doesn't log you
 * in, it just queues the request.
 *
 * Requires the vp-affiliates plugin endpoint POST /vp-affiliates/v1/register.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

const WC_URL = (process.env.WC_URL || '').replace(/\/+$/, '');
const WC_USER = process.env.WC_USER || '';
const WC_APP_PASSWORD = process.env.WC_APP_PASSWORD || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, password, storefront } = req.body ?? {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }
  if (!WC_URL) {
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  try {
    const r = await fetch(`${WC_URL}/wp-json/vp-affiliates/v1/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + Buffer.from(`${WC_USER}:${WC_APP_PASSWORD}`).toString('base64'),
      },
      body: JSON.stringify({ name, email, password, storefront }),
      signal: AbortSignal.timeout(10_000),
    });

    const data = await r.json().catch(() => ({}));

    if (!r.ok) {
      return res.status(r.status).json({ error: data.error || 'Registration failed.' });
    }

    return res.status(200).json({ success: true, status: data.status || 'pending' });
  } catch (e) {
    console.error('[affiliate-register]', e);
    return res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
}
