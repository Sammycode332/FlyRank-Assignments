import { Request, Response, NextFunction } from 'express';
import supabase from '../supabase';

/* -------------------------------------------------------
   Authentication Middleware
   -------------------------------------------------------
   Security contract
   ─────────────────
   1. Read the Authorization header.
   2. Require the "Bearer <token>" format.
   3. Strip the "Bearer " prefix to extract the raw JWT.
   4. Reject missing header → 401.
   5. Reject any token that Supabase cannot verify → 401.
   6. Verify the token server-side via supabase.auth.getUser()
      – we NEVER trust a user-id supplied by the client.
   7. Attach the verified user and the raw token to req so
      that downstream route handlers can access them safely.
   8. Only call next() after successful verification.
   ------------------------------------------------------- */
async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {

  // ── Step 1 & 4: Read header; reject if missing ──────────
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      error: 'Authorization header is required',
    });
    return;
  }

  // ── Step 2 & 3: Validate "Bearer <token>" format ─────────
  const parts = authHeader.split(' ');

  if (parts[0] !== 'Bearer' || parts.length !== 2 || !parts[1]) {
    res.status(401).json({
      error: 'Authorization header must use the format: Bearer <token>',
    });
    return;
  }

  const token = parts[1]; // raw JWT, "Bearer " prefix removed

  // ── Step 5, 6 & 7: Verify token on the backend ───────────
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    res.status(401).json({
      error: 'Invalid, expired, or malformed token',
    });
    return;
  }

  // ── Step 7: Attach verified identity to the request ──────
  req.user  = data.user;
  req.token = token;

  // ── Step 8: Only reach here on success ───────────────────
  next();
}

export default authMiddleware;
