/* =============================================================
   AI Auth API — Main Entry Point (index.ts)
   =============================================================
   WHAT IS THIS FILE?
   ──────────────────
   This is the "front door" of the whole application.
   It does four things:
     1. Creates the Express app
     2. Registers global middleware (things that run on EVERY request)
     3. Mounts the routers (groups of routes for /auth, /protected, /ai)
     4. Starts the HTTP server

   WHAT IS EXPRESS?
   ────────────────
   Express is a framework for Node.js that makes it easy to
   create HTTP servers. Instead of writing raw Node.js HTTP code,
   Express gives us:
     • app.get() / app.post() / app.use() etc.
     • Middleware pipeline (runs code before/after route handlers)
     • Router (groups of routes you can mount at a path)

   MIDDLEWARE PIPELINE
   ───────────────────
   Every incoming request flows through middleware IN ORDER:
       Request
         ↓
       CORS middleware        (handles browser cross-origin requests)
         ↓
       JSON parser            (turns request body JSON string → JS object)
         ↓
       General rate limiter   (blocks IPs sending too many requests)
         ↓
       Request logger         (prints the request to the console)
         ↓
       [Route handler]        (your actual route code runs here)
         ↓
       Error handler          (catches any crashes and returns clean JSON)
         ↓
       Response sent to client

   PORT CHOICE
   ───────────
   This runs on port 4000 by default.
   Your existing CRUD API runs on port 3000.
   Running on different ports lets both run at the same time.
   ============================================================= */

import 'dotenv/config';          // ← MUST be first line: loads .env into process.env
import express, { Request, Response } from 'express';
import cors from 'cors';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import { requestLogger }  from './middleware/logger.middleware';
import { generalLimiter } from './middleware/rate-limit.middleware';
import { errorHandler }   from './middleware/error.middleware';

import authRouter      from './routes/auth.routes';
import protectedRouter from './routes/protected.routes';
import aiRouter        from './routes/ai.routes';
import { swaggerSpec } from './swagger';

const app  = express();
const PORT = process.env.PORT ?? 4000;


/* =============================================================
   GLOBAL MIDDLEWARE
   =============================================================
   These run on EVERY request, in the order they're registered.
   ============================================================= */

/* ── CORS ──────────────────────────────────────────────────
   WHAT IS CORS?
   CORS = Cross-Origin Resource Sharing.
   Browsers block JavaScript on one website (e.g. localhost:3000)
   from calling an API on a different origin (e.g. localhost:4000)
   unless the API explicitly says "that's fine".
   This middleware adds the right headers to every response so
   browsers allow the requests.
   Without this, Swagger UI in a browser would get blocked.   */
app.use(cors());

/* ── JSON body parser ───────────────────────────────────────
   WHAT IS THIS?
   When a client sends a POST request with a JSON body:
       { "email": "test@example.com", "password": "abc" }
   It arrives as a raw text string. express.json() reads that
   string and converts it into a real JavaScript object so we
   can write:  const { email } = req.body;
   Without this, req.body would be undefined.                  */
app.use(express.json());

/* ── General rate limiter ────────────────────────────────────
   Applies a loose limit (100 req / 15 min) to ALL routes.
   The /ai routes and /auth routes have their own tighter
   limits IN ADDITION to this one.                            */
app.use(generalLimiter);

/* ── Request logger ─────────────────────────────────────────
   Prints every request to the console AFTER the response is
   sent, e.g.:
     ✓ [2026-09-22 17:05:03] POST   /auth/login → 200  (45ms)
     ✓ [2026-09-22 17:05:10] POST   /ai/chat    → 200  (823ms) [user@example.com]
   Helps you see what's happening while testing.              */
app.use(requestLogger);


/* =============================================================
   SWAGGER / OPENAPI CONFIGURATION
   =============================================================
   WHAT IS SWAGGER?
   ────────────────
   Swagger UI is an auto-generated interactive web page that
   documents your API. Instead of reading a Word doc, developers
   can open /docs and:
     • See all routes
     • Read what each one expects
     • Click a "Try it out" button to actually call the API
     • Paste their JWT and test protected routes in the browser

   HOW DOES IT KNOW ABOUT YOUR ROUTES?
   ─────────────────────────────────────
   We write @swagger comments above each route (in the route files).
   swagger-jsdoc reads those comments and builds a JSON spec.
   swagger-ui-express serves that spec as a visual web page.

   THE SECURITY SCHEME
   ───────────────────
   We define a "bearerAuth" scheme here. This adds a 🔒 button
   in the Swagger UI. Click it, paste your access_token, and all
   protected routes will automatically include the header:
       Authorization: Bearer <your-token>
   ============================================================= */
/* Swagger configuration imported from ./swagger */


/* =============================================================
   ROUTES
   =============================================================
   app.use('/prefix', router) mounts a router at a URL prefix.
   All routes defined inside authRouter are available at /auth/...
   ============================================================= */

/* ── Health check ────────────────────────────────────────────
   @swagger
   /health:
     get:
       summary: Liveness check — is the server running?
       tags:
         - General
       responses:
         '200':
           description: Server is running
   ─────────────────────────────────────────────────────────── */
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status:  'ok',
    project: 'AI Auth API',
    version: '2.0.0',
    port:    PORT,
  });
});

/* ── Root info ───────────────────────────────────────────────
   @swagger
   /:
     get:
       summary: API information and full route map
       tags:
         - General
       responses:
         '200':
           description: API metadata and all available routes
   ─────────────────────────────────────────────────────────── */
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    name:    'AI Auth API',
    version: '2.0.0',
    docs:    `http://localhost:${PORT}/docs`,
    routes: {
      public: [
        'POST /auth/signup          – Register a new account',
        'POST /auth/login           – Login and get tokens',
        'POST /auth/refresh         – Refresh an expired access_token',
        'POST /ai/analyze-password  – AI password strength report (no login needed)',
        'GET  /health               – Server status',
      ],
      protected: [
        'POST /auth/logout              – Sign out',
        'GET  /protected/profile        – Your profile from Supabase',
        'GET  /protected/dashboard      – Personalised dashboard',
      ],
      ai_powered: [
        'POST /ai/chat              – Chat with Gemini AI',
        'POST /ai/summarize         – Summarise text with AI',
        'POST /ai/generate-bio      – AI writes your professional bio',
        'POST /ai/code-review       – AI reviews your code',
        'POST /ai/translate         – Translate text to any language',
        'GET  /ai/tip               – Random security/dev tip from AI',
      ],
    },
  });
});

/* ── Auth routes  (POST /auth/signup, /login, /logout, /refresh) */
app.use('/auth', authRouter);

/* ── Protected routes (GET /protected/profile, /dashboard)       */
app.use('/protected', protectedRouter);

/* ── AI routes  (POST /ai/chat, /summarize, etc.)               */
app.use('/ai', aiRouter);

/* ── Swagger UI  (GET /docs) ────────────────────────────────────
   persistAuthorization: true means the token stays in the form
   even if you refresh the Swagger page.                         */
app.use(
  '/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    swaggerOptions: { persistAuthorization: true },
  })
);


/* =============================================================
   GLOBAL ERROR HANDLER
   =============================================================
   MUST be registered LAST — after all routes.
   When any route calls next(err) or throws an unhandled error,
   Express skips all other middleware and comes here.
   This guarantees the server always returns clean JSON.
   ============================================================= */
app.use(errorHandler);


/* =============================================================
   START SERVER
   ============================================================= */
app.listen(PORT, () => {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  🚀  AI Auth API v2 started');
  console.log(`  🌐  Server:    http://localhost:${PORT}`);
  console.log(`  📖  Swagger:   http://localhost:${PORT}/docs`);
  console.log(`  ❤️   Health:    http://localhost:${PORT}/health`);
  console.log(`  🤖  AI routes: http://localhost:${PORT}/ai/chat`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});
