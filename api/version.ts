/**
 * GET /api/version
 *
 * Pure diagnostic endpoint — returns a build marker so it's possible to
 * confirm from outside (a plain GET, no login required) whether a given
 * deployment is actually serving the latest code, without needing to run
 * a POST test through the browser console every time. Bump BUILD_MARKER
 * whenever you need a fresh, unambiguous way to confirm a deploy went live.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

const BUILD_MARKER = 'secret-field-fix-2026-07-20-2200';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({
    build: BUILD_MARKER,
    now: new Date().toISOString(),
  });
}
