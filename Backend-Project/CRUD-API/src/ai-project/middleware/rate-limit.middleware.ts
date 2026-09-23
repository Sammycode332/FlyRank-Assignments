import rateLimit from 'express-rate-limit';

/* =============================================================
   Rate Limiting Middleware
   =============================================================
   WHY does this exist?
   ────────────────────
   Every call to /ai/* costs Gemini API quota.
   Without a limit, a single user (or a bot) could send thousands
   of requests in seconds and drain your free-tier allowance.

   HOW it works
   ────────────
   express-rate-limit tracks how many requests each IP address
   has made in a rolling time window.  When they exceed the
   limit, it sends 429 Too Many Requests and stops the request
   BEFORE it reaches the route handler — so Gemini is never called.

   Two separate limiters are exported:
     aiLimiter      – tight limit for expensive AI calls (20 / 15 min)
     authLimiter    – moderate limit for auth calls to stop brute-force (10 / 15 min)
     generalLimiter – loose limit for all other routes (100 / 15 min)
   ============================================================= */


/* ── AI route limiter ───────────────────────────────────────
   20 requests per IP per 15 minutes.
   Protects Gemini API quota and prevents abuse.               */
export const aiLimiter = rateLimit({
  windowMs:         15 * 60 * 1000,   // 15 minutes in milliseconds
  max:              20,               // max 20 requests per window per IP
  standardHeaders:  true,            // sends RateLimit-* headers to client
  legacyHeaders:    false,
  message: {
    error: 'Too many AI requests from this IP. Please wait 15 minutes and try again.',
    retryAfter: '15 minutes',
  },
});


/* ── Auth route limiter ─────────────────────────────────────
   10 login/signup attempts per IP per 15 minutes.
   Slows down brute-force password attacks.                    */
export const authLimiter = rateLimit({
  windowMs:         15 * 60 * 1000,
  max:              10,
  standardHeaders:  true,
  legacyHeaders:    false,
  message: {
    error: 'Too many authentication attempts from this IP. Please wait 15 minutes.',
    retryAfter: '15 minutes',
  },
});


/* ── General limiter ────────────────────────────────────────
   100 requests per IP per 15 minutes for all other routes.   */
export const generalLimiter = rateLimit({
  windowMs:         15 * 60 * 1000,
  max:              100,
  standardHeaders:  true,
  legacyHeaders:    false,
  message: {
    error: 'Too many requests from this IP. Please slow down.',
  },
});
