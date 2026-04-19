// api/_auth.js – shared server-side admin authorization helper
// All write endpoints call this before touching the database.
//
// Authorization is checked via the `Authorization: Bearer <token>` header.
// The token must match the ADMIN_SECRET environment variable (defaults to
// "markvegas" when the variable is not set, but operators SHOULD set it to
// a strong random secret in Vercel → Project Settings → Environment Variables).

import crypto from 'node:crypto';

/**
 * Validate the Authorization header using a constant-time comparison to
 * prevent timing side-channel attacks.
 * Returns `true` when the request is authorized.
 * Sends a 401 response and returns `false` when it is not.
 *
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse}  res
 * @returns {boolean}
 */
export function requireAuth(req, res) {
  const secret = process.env.ADMIN_SECRET || 'markvegas';
  const authHeader = req.headers['authorization'] ?? '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : '';

  // Use constant-time comparison to avoid timing attacks.
  const secretBuf = Buffer.from(secret);
  const tokenBuf  = Buffer.from(token);

  const authorized =
    tokenBuf.length === secretBuf.length &&
    crypto.timingSafeEqual(tokenBuf, secretBuf);

  if (!authorized) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}
