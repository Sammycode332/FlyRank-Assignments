import { Request, Response, NextFunction } from 'express';

/* =============================================================
   Request Logger Middleware
   =============================================================
   Logs every incoming request to the console with:
     - HTTP method + path
     - Status code (logged AFTER response is sent)
     - Response time in ms
     - Authenticated user email (if JWT was verified)

   Example output:
     [2026-09-22 17:05:00] POST /auth/login → 200  (42ms)
     [2026-09-22 17:05:03] POST /ai/chat   → 200  (831ms) [user@example.com]
   ============================================================= */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {

  const start  = Date.now();
  const now    = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const method = req.method.padEnd(6);
  const path   = req.path;

  // Hook into the response finish event to log AFTER the handler runs
  res.on('finish', () => {
    const ms   = Date.now() - start;
    const code = res.statusCode;
    const user = req.user?.email ? ` [${req.user.email}]` : '';

    // Colour-code status: green 2xx, yellow 3xx/4xx, red 5xx
    const symbol =
      code < 300 ? '✓' :
      code < 500 ? '⚠' :
                   '✗';

    console.log(`${symbol} [${now}] ${method} ${path} → ${code}  (${ms}ms)${user}`);
  });

  next();
}
