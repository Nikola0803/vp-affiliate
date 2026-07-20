/**
 * POST /api/affiliate-reset-password
 * Body: { token: string, new_password: string }
 *
 * Consumes the token emailed by affiliate-forgot-password.ts and sets a new
 * password. No session cookie is touched here — after a successful reset the
 * affiliate still logs in normally with their new password.
 *
 * Requires the vp-affiliates plugin endpoint POST /vp-affiliates/v1/auth/reset-password.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

const WC_URL = (process.env.WC_URL || '').replace(/\/+$/, '');
const WC_USER = process.env.WC_USER || '';
const WC_APP_PASSWORD = process.env.WC_APP_PASSWORD || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, new_password } = req.body ?? {};
  if (!token || !new_password) {
    return res.status(400).json({ error: 'Reset token and new password are required.' });
  }
  if (!WC_URL) {
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  try {
    const r = await fetch(`${WC_URL}/wp-json/vp-affiliates/v1/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + Buffer.from(`${WC_USER}:${WC_APP_PASSWORD}`).toString('base64'),
      },
      body: JSON.stringify({ token, new_password }),
      signal: AbortSignal.timeout(10_000),
    });

    const data = await r.json().catch(() => ({}));

    if (!r.ok) {
      return res.status(r.status).json({ error: data.error || 'Could not reset password. Please request a new link.' });
    }

    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('[affiliate-reset-password]', e);
    return res.status(500).json({ error: 'Could not reset password. Please try again.' });
  }
}
