/* =============================================================
   Auth Routes
   =============================================================
   WHAT IS THIS FILE?
   ──────────────────
   An Express Router that handles all user authentication.
   In index.ts:  app.use('/auth', authRouter)
   So every route here gets /auth in front of it.

   ROUTES IN THIS FILE
   ───────────────────
   POST /auth/signup   – Create a new account
   POST /auth/login    – Log in, get access_token + refresh_token
   POST /auth/logout   – Sign out (protected — needs a valid token)
   POST /auth/refresh  – Exchange a refresh_token for a new access_token

   SUPABASE AUTH OVERVIEW
   ──────────────────────
   Supabase handles ALL the heavy lifting:
     • Password hashing (bcrypt under the hood)
     • JWT creation and signing
     • Token expiry management
     • Session storage

   We never store passwords. We never create JWTs manually.
   We just call Supabase and it does the secure work.

   WHAT IS A TOKEN?
   ────────────────
   access_token  – A JWT (JSON Web Token). It's like a signed
                   visitor badge. It proves you logged in, lasts
                   ~1 hour, and is sent with every protected request.

   refresh_token – A long-lived token (no expiry) used ONLY to
                   get a new access_token when the old one expires.
                   Keep it secret — it's basically a permanent pass.
   ============================================================= */

import { Router, Request, Response } from 'express';
import supabase from '../supabase';
import authMiddleware from '../middleware/auth.middleware';
import { authLimiter } from '../middleware/rate-limit.middleware';

const authRouter = Router();

// Apply the auth rate limiter to every /auth route
// (10 attempts per 15 minutes per IP — stops brute-force attacks)
authRouter.use(authLimiter);


/* =============================================================
   POST /auth/signup
   =============================================================
   WHAT HAPPENS STEP BY STEP:
   1. We receive email + password from the request body
   2. We check they're both present (400 if not)
   3. We call supabase.auth.signUp() — Supabase:
        a. Checks if the email already exists
        b. Hashes the password (we NEVER see the plain password again)
        c. Creates the user record
        d. Sends a confirmation email (if enabled in Supabase dashboard)
   4. We return 201 with the new user object

   STATUS CODES:
     201 – success
     400 – missing fields OR Supabase rejected the signup
           (e.g. password too short, email already in use)

   @swagger
   /auth/signup:
     post:
       summary: Register a new user account
       description: >
         Creates a new user in Supabase Auth. The password is hashed
         by Supabase — we never store or see it. Returns 201 on success.
         Supabase may send a confirmation email depending on your project settings.
       tags:
         - Auth
       requestBody:
         required: true
         content:
           application/json:
             schema:
               type: object
               required:
                 - email
                 - password
               properties:
                 email:
                   type: string
                   format: email
                   example: user@example.com
                 password:
                   type: string
                   format: password
                   minLength: 6
                   example: "MySecureP@ss1"
       responses:
         '201':
           description: Account created successfully
           content:
             application/json:
               schema:
                 type: object
                 properties:
                   message:
                     type: string
                   user:
                     type: object
         '400':
           description: Missing fields or Supabase rejected the signup
           content:
             application/json:
               schema:
                 $ref: '#/components/schemas/ErrorResponse'
         '429':
           description: Too many signup attempts — rate limit exceeded
   ============================================================= */
authRouter.post('/signup', async (req: Request, res: Response) => {

  const { email, password } = req.body as {
    email?: string;
    password?: string;
  };

  // Step 1 — Validate inputs
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  // Step 2 — Ask Supabase to create the account
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    // Supabase gives a clear error message — pass it through
    res.status(400).json({ error: error.message });
    return;
  }

  // Step 3 — Return the created user (no sensitive info)
  res.status(201).json({
    message: 'Account created! Check your email for a confirmation link.',
    user:    data.user,
  });
});


/* =============================================================
   POST /auth/login
   =============================================================
   WHAT HAPPENS STEP BY STEP:
   1. Receive email + password
   2. Validate they're present (400 if not)
   3. Call supabase.auth.signInWithPassword() — Supabase:
        a. Finds the user by email
        b. Compares the password hash
        c. If correct → creates a session and returns two tokens
   4. We return the access_token and refresh_token

   WHY DO WE RETURN BOTH TOKENS?
   ─────────────────────────────
   The client stores both:
     • access_token  → sent in "Authorization: Bearer <token>" header
     • refresh_token → stored securely, used to get a new access_token
                       when the current one expires (~1 hour)

   STATUS CODES:
     200 – success
     400 – missing fields
     401 – wrong email or password (Supabase returns an error)
     429 – rate limited

   @swagger
   /auth/login:
     post:
       summary: Log in and receive JWT tokens
       description: >
         Authenticates with Supabase and returns an access_token
         (use as Bearer JWT for protected routes) and a refresh_token
         (use to get a new access_token when it expires).
       tags:
         - Auth
       requestBody:
         required: true
         content:
           application/json:
             schema:
               type: object
               required:
                 - email
                 - password
               properties:
                 email:
                   type: string
                   format: email
                   example: user@example.com
                 password:
                   type: string
                   format: password
                   example: "MySecureP@ss1"
       responses:
         '200':
           description: Login successful — returns access and refresh tokens
           content:
             application/json:
               schema:
                 type: object
                 properties:
                   access_token:
                     type: string
                     description: Short-lived JWT — use as Bearer token for protected routes
                   refresh_token:
                     type: string
                     description: Long-lived token — use to get a new access_token
                   expires_in:
                     type: integer
                     description: Seconds until the access_token expires
                   token_type:
                     type: string
                     example: Bearer
         '400':
           description: Missing email or password
           content:
             application/json:
               schema:
                 $ref: '#/components/schemas/ErrorResponse'
         '401':
           description: Wrong credentials
           content:
             application/json:
               schema:
                 $ref: '#/components/schemas/ErrorResponse'
         '429':
           description: Too many login attempts
   ============================================================= */
authRouter.post('/login', async (req: Request, res: Response) => {

  const { email, password } = req.body as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session) {
    // Always return 401 for bad credentials — never reveal whether
    // the email exists (that would be a user enumeration vulnerability)
    res.status(401).json({ error: 'Invalid login credentials' });
    return;
  }

  res.status(200).json({
    access_token:  data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_in:    data.session.expires_in,
    token_type:    'Bearer',
  });
});


/* =============================================================
   POST /auth/refresh
   =============================================================
   WHY DOES THIS ROUTE EXIST?
   ──────────────────────────
   The access_token only lives for ~1 hour.
   When it expires, the client gets 401 errors.
   Instead of forcing the user to log in again, they send
   their refresh_token here to get a brand-new access_token.

   Think of it like:
     access_token  = a day-pass (expires tonight)
     refresh_token = a season ticket (exchange it for a new day-pass)

   WHAT GOES IN:
     { "refresh_token": "your-long-lived-refresh-token" }

   WHAT COMES BACK:
     { "access_token": "...", "refresh_token": "...", "expires_in": 3600 }

   NOTE: Supabase rotates the refresh_token on each use —
   you get a NEW refresh_token back too. Store it!

   STATUS CODES:
     200 – new tokens returned
     400 – refresh_token missing
     401 – refresh_token is invalid or expired

   @swagger
   /auth/refresh:
     post:
       summary: Refresh an expired access token
       description: >
         Exchange a valid refresh_token for a new access_token.
         The access_token expires every ~1 hour. Use this endpoint
         to renew it without re-entering credentials.
         Supabase also rotates the refresh_token on each use.
       tags:
         - Auth
       requestBody:
         required: true
         content:
           application/json:
             schema:
               type: object
               required:
                 - refresh_token
               properties:
                 refresh_token:
                   type: string
                   example: "your-refresh-token-here"
       responses:
         '200':
           description: New access and refresh tokens returned
           content:
             application/json:
               schema:
                 type: object
                 properties:
                   access_token:
                     type: string
                   refresh_token:
                     type: string
                   expires_in:
                     type: integer
         '400':
           description: refresh_token is required
         '401':
           description: refresh_token is invalid or expired
         '429':
           description: Too many refresh attempts
   ============================================================= */
authRouter.post('/refresh', async (req: Request, res: Response) => {

  const { refresh_token } = req.body as { refresh_token?: string };

  if (!refresh_token) {
    res.status(400).json({ error: '"refresh_token" is required' });
    return;
  }

  // Ask Supabase to exchange the refresh_token for a new session
  const { data, error } = await supabase.auth.refreshSession({
    refresh_token,
  });

  if (error || !data.session) {
    res.status(401).json({ error: 'refresh_token is invalid or has expired. Please log in again.' });
    return;
  }

  res.status(200).json({
    access_token:  data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_in:    data.session.expires_in,
  });
});


/* =============================================================
   POST /auth/logout         ← PROTECTED (authMiddleware first)
   =============================================================
   WHAT HAPPENS:
   1. authMiddleware verifies the Bearer token — 401 if invalid
   2. We call supabase.auth.signOut() which invalidates the session
      on Supabase's side
   3. Return 204 No Content (success with no body)

   WHY 204 AND NOT 200?
   ─────────────────────
   HTTP 204 means "success, but there's nothing to return".
   Logout has no meaningful body to send back — we just confirm
   it worked by returning 204.

   IMPORTANT SECURITY NOTE:
   Calling supabase.auth.signOut() invalidates the token on the
   server. Even if someone still has the access_token, it won't
   work anymore on any Supabase-verified endpoint.

   @swagger
   /auth/logout:
     post:
       summary: Sign out the authenticated user
       description: >
         Invalidates the user's session in Supabase. Even if someone
         has the access_token after this, it will no longer be accepted.
         Requires a valid Bearer JWT. Returns 204 No Content on success.
       tags:
         - Auth
       security:
         - bearerAuth: []
       responses:
         '204':
           description: Logged out successfully — no content returned
         '401':
           description: Missing or invalid token
           content:
             application/json:
               schema:
                 $ref: '#/components/schemas/ErrorResponse'
         '429':
           description: Too many requests
   ============================================================= */
authRouter.post(
  '/logout',
  authMiddleware,      // ← Must verify JWT before we sign out
  async (req: Request, res: Response) => {

    const { error } = await supabase.auth.signOut();

    if (error) {
      res.status(401).json({ error: 'Logout failed: ' + error.message });
      return;
    }

    // 204 No Content — nothing to return on successful logout
    res.status(204).send();
  }
);


export default authRouter;
