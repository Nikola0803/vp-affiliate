/**
 * POST /api/affiliate-materials-submit
 * Body: { type: 'image' | 'text' | 'link', title: string, content: string }
 *
 * Lets a logged-in affiliate submit their own marketing material. Only
 * accepted if the storefront has "allow affiliate materials" turned on in
 * WP Admin — WordPress enforces that and returns a 403 otherwise. Submissions
 * land as pending and won't appear on the public Materials list until an
 * admin approves them.
 *
 * Requires the vp-affiliates plugin endpoint POST /vp-affiliates/v1/materials/submit.
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

  const { type, title, content } = req.body ?? {};
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required.' });
  }

  try {
    const r = await fetch(`${WC_URL}/wp-json/vp-affiliates/v1/materials/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ type, title, content }),
      signal: AbortSignal.timeout(10_000),
    });

    const data = await r.json().catch(() => ({}));

    if (!r.ok) {
      return res.status(r.status).json({ error: data.error || 'Failed to submit material.' });
    }

    return res.status(200).json({ success: true, status: data.status || 'pending' });
  } catch (e) {
    console.error('[affiliate-materials-submit]', e);
    return res.status(500).json({ error: 'Failed to submit material.' });
  }
}
