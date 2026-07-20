/**
 * GET /api/affiliate-materials?storefront=vintage
 *
 * Public marketing-assets proxy (banners/copy/links an affiliate can grab
 * for sharing). Doesn't require login on the WP side, but the portal only
 * links to it from inside the dashboard so affiliates browse materials for
 * their own storefront.
 *
 * NOTE: no WC_USER/WC_APP_PASSWORD Basic Auth — the GET side of this WP
 * route is public (`permission_callback` => `__return_true`). See
 * affiliate-login.ts for why sending a (possibly stale) app password here
 * anyway is actively harmful rather than just redundant.
 *
 * Requires the vp-affiliates plugin endpoint GET /vp-affiliates/v1/materials.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Force https and strip trailing slashes. ROOT CAUSE 2026-07-20: the
// WC_URL env var was set to http:// — and plain-HTTP db.vintagepeptides.com
// serves a STALE WordPress with an old vp-affiliates plugin missing the
// /auth/login and /register routes (rest_no_route 404), while https serves
// the real, current site. Every "login/signup 404" traced back to this.
// Forcing https here makes the scheme mistake impossible to repeat.
const WC_URL = (process.env.WC_URL || '').replace(/\/+$/, '').replace(/^http:\/\//i, 'https://');

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
