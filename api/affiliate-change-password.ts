/**
 * POST /api/affiliate-change-password
 * Body: { current_password: string, new_password: string }
 *
 * Reads the affiliate's session token out of the httpOnly cookie (same as
 * affiliate-dashboard.ts) and forwards it as a bearer token so the affiliate
 * can change their own password from Account Settings without admin help.
 *
 * Requires the vp-affiliates plugin endpoint POST /vp-affiliates/v1/account/password.
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

  const { current_password, new_password } = req.body ?? {};
  if (!current_password || !new_password) {
    return res.status(400).json({ error: 'Current and new password are required.' });
  }

  try {
    // Sent as current_secret/new_secret, not current_password/new_password —
    // see affiliate-login.ts for why (some hosts silently 404 any POST body
    // containing a literal "password" field, independent of any WP plugin).
    const r = await fetch(`${WC_URL}/wp-json/vp-affiliates/v1/account/password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        // Browser-like headers — same reason as affiliate-authenticate.ts:
        // the WP host's edge rule 404s bot-looking server-to-server POSTs
        // to auth-ish endpoints ("password" is literally in this path).
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'Origin': `https://${req.headers.host || 'affiliate.vintagepeptides.com'}`,
        'Referer': `https://${req.headers.host || 'affiliate.vintagepeptides.com'}/`,
      },
      body: JSON.stringify({ current_secret: current_password, new_secret: new_password }),
      signal: AbortSignal.timeout(10_000),
    });

    const data = await r.json().catch(() => ({}));

    if (!r.ok) {
      return res.status(r.status).json({ error: data.error || 'Failed to change password.' });
    }

    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('[affiliate-change-password]', e);
    return res.status(500).json({ error: 'Failed to change password.' });
  }
}
