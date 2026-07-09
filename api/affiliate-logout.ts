/**
 * POST /api/affiliate-logout
 * Clears the httpOnly affiliate session cookie set by /api/affiliate-login.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

const COOKIE_NAME = 'vp_aff_session';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`);
  return res.status(200).json({ success: true });
}
