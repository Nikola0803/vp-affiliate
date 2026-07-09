/**
 * GET /api/affiliate-materials?storefront=vintage
 *
 * Public marketing-assets proxy (banners/copy/links an affiliate can grab
 * for sharing). Doesn't require login on the WP side, but the portal only
 * links to it from inside the dashboard so affiliates browse materials for
 * their own storefront.
 *
 * Requires the vp-affiliates plugin endpoint GET /vp-affiliates/v1/materials.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

const WC_URL = (process.env.WC_URL || '').replace(/\/+$/, '');
const WC_USER = process.env.WC_USER || '';
const WC_APP_PASSWORD = process.env.WC_APP_PASSWORD || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!WC_URL) {
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  const storefront = typeof req.query.storefront === 'string' ? req.query.storefront : '';

  try {
    const url = new URL(`${WC_URL}/wp-json/vp-affiliates/v1/materials`);
    if (storefront) url.searchParams.set('storefront', storefront);

    const r = await fetch(url.toString(), {
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${WC_USER}:${WC_APP_PASSWORD}`).toString('base64'),
      },
      signal: AbortSignal.timeout(10_000),
    });

    const data = await r.json().catch(() => ({}));

    if (!r.ok) {
      return res.status(r.status).json({ error: data.error || 'Failed to load materials.' });
    }

    return res.status(200).json(data);
  } catch (e) {
    console.error('[affiliate-materials]', e);
    return res.status(500).json({ error: 'Failed to load materials.' });
  }
}
