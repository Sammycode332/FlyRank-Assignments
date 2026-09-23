import { Request, Response, NextFunction } from 'express';

/* =============================================================
   Global Error Handler Middleware
   =============================================================
   WHY does this exist?
   ────────────────────
   In Express, if ANY route throws an error that isn't caught
   by a try/catch inside the route handler itself, the server
   would normally:
     (a) Return a cryptic HTML error page with a stack trace
     (b) Or crash entirely

   Neither is acceptable in a real API.

   HOW it works
   ────────────
   Express has a special middleware signature with 4 arguments:
       (err, req, res, next)
   When Express sees this signature it treats it as an error
   handler.  Any time you call next(err) or a route throws,
   Express skips all normal middleware and goes straight to this.

   WHAT it does
   ────────────
   1. Logs the full error to the server console (so you can debug)
   2. Checks if the error has a known status code
   3. Returns a clean JSON error response to the client
   4. NEVER leaks a stack trace to the client in production

   HOW to register it
   ──────────────────
   It MUST be registered LAST in index.ts, after all routes:
       app.use(errorHandler);

   HOW to trigger it from a route
   ───────────────────────────────
   Option 1 – call next(err):
       catch (err) { next(err); }

   Option 2 – throw inside an async route (Express 5 catches it):
       throw new Error('Something broke');
   ============================================================= */
export function errorHandler(
  err:  Error & { status?: number; statusCode?: number },
  req:  Request,
  res:  Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction   // the 4th param must exist even if unused
): void {

  /* ── 1. Log the full error server-side ─────────────────── */
  console.error(`\n❌ [Error Handler] ${req.method} ${req.path}`);
  console.error(`   Message: ${err.message}`);
  if (process.env.NODE_ENV !== 'production') {
    console.error(`   Stack:   ${err.stack ?? 'no stack'}`);
  }

  /* ── 2. Determine the HTTP status code ─────────────────── */
  // The error may carry a .status or .statusCode property
  // (libraries like http-errors use this convention).
  // Fall back to 500 Internal Server Error if none is present.
  const statusCode =
    err.status ??
    err.statusCode ??
    (res.statusCode !== 200 ? res.statusCode : 500);

  /* ── 3. Send a clean JSON response ─────────────────────── */
  res.status(statusCode).json({
    error: err.message ?? 'An unexpected server error occurred.',
    // Only include the path info in development — never in production
    ...(process.env.NODE_ENV !== 'production' && {
      path:   req.path,
      method: req.method,
    }),
  });
}
