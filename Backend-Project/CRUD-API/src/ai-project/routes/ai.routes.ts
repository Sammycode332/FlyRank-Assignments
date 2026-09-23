/* =============================================================
   AI Routes — Full Edition
   =============================================================
   WHAT IS THIS FILE?
   ──────────────────
   This is an Express Router — think of it as a mini-app that
   handles all routes starting with /ai.

   In index.ts we write:
       app.use('/ai', aiRouter)
   So every route defined here automatically gets /ai in front.

   WHAT ARE THESE ROUTES?
   ──────────────────────
   POST /ai/chat              → Chat with Gemini (protected)
   POST /ai/summarize         → Summarise text (protected)
   POST /ai/analyze-password  → AI password strength report (PUBLIC)
   POST /ai/generate-bio      → AI writes your professional bio (protected)
   POST /ai/code-review       → AI reviews your code (protected)
   POST /ai/translate         → Translate any text (protected)
   GET  /ai/tip               → Random security/dev tip (protected)

   WHY ARE MOST ROUTES PROTECTED?
   ───────────────────────────────
   Each AI call costs Google Gemini API quota.
   If the routes were public, anyone on the internet could spam
   them and drain your free quota in minutes.
   By requiring a valid JWT, only registered users can use them.

   EXCEPTION: /ai/analyze-password is PUBLIC because it's a
   self-contained tool — the user might not be logged in yet
   but still wants to check if their password is strong enough
   before they sign up.

   HOW THE SECURITY WORKS
   ──────────────────────
   authMiddleware is applied as a router-level middleware:
       aiRouter.use(authMiddleware)
   This means EVERY route in this file requires a valid JWT EXCEPT
   the ones registered BEFORE that line (analyze-password).
   ============================================================= */

import { Router, Request, Response } from 'express';
import authMiddleware from '../middleware/auth.middleware';
import { aiLimiter } from '../middleware/rate-limit.middleware';
import {
  chat,
  summarize,
  analyzePassword,
  generateBio,
  reviewCode,
  translate,
  getSecurityTip,
} from '../ai/gemini';

const aiRouter = Router();


/* =============================================================
   POST /ai/analyze-password   ← PUBLIC (no auth needed)
   =============================================================
   WHY PUBLIC?
   ───────────
   A user might want to check their password strength BEFORE
   they sign up. Requiring login here defeats the purpose.

   WHAT GOES IN:
     { "password": "MyPassword123!" }

   WHAT COMES BACK:
     {
       "score": 7,
       "strength": "Strong",
       "feedback": ["Add symbols", "..."],
       "verdict": "..."
     }

   SECURITY NOTE:
   We never log, store, or echo back the password.
   Gemini analyses the PATTERN — it does not remember it.

   @swagger
   /ai/analyze-password:
     post:
       summary: Analyse password strength using AI
       description: >
         Submit a password and receive an AI-generated security
         report with a score (0–10), strength label, specific
         feedback tips, and a plain-English verdict.
         **This endpoint is public — no login required.**
         The password is never stored or logged.
       tags:
         - AI
       requestBody:
         required: true
         content:
           application/json:
             schema:
               type: object
               required:
                 - password
               properties:
                 password:
                   type: string
                   example: "MyP@ssword123"
       responses:
         '200':
           description: Password analysis report
           content:
             application/json:
               schema:
                 type: object
                 properties:
                   score:
                     type: integer
                     example: 7
                   strength:
                     type: string
                     example: Strong
                   feedback:
                     type: array
                     items:
                       type: string
                   verdict:
                     type: string
         '400':
           description: password field is missing
           content:
             application/json:
               schema:
                 $ref: '#/components/schemas/ErrorResponse'
         '429':
           description: Too many requests – rate limit exceeded
         '502':
           description: Gemini AI service error
   ============================================================= */
aiRouter.post(
  '/analyze-password',
  aiLimiter,            // ← rate limit even though public, to prevent abuse
  async (req: Request, res: Response) => {

    const { password } = req.body as { password?: string };

    if (!password || password.trim() === '') {
      res.status(400).json({ error: '"password" is required' });
      return;
    }

    try {
      const analysis = await analyzePassword(password);
      res.status(200).json(analysis);
    } catch (err) {
      console.error('[AI /analyze-password error]', err);
      res.status(502).json({ error: 'AI service error. Please try again.' });
    }
  }
);


/* =============================================================
   Everything below requires a valid JWT token
   =============================================================
   authMiddleware is applied HERE so that:
     - /ai/analyze-password (registered above) stays PUBLIC
     - All routes registered BELOW are PROTECTED

   HOW authMiddleware works (recap):
     1. Reads the "Authorization" header
     2. Extracts the token after "Bearer "
     3. Calls supabase.auth.getUser(token) to verify it
     4. Attaches the verified user to req.user
     5. Calls next() only if verification succeeds
     6. Returns 401 if anything is wrong
   ============================================================= */
aiRouter.use(authMiddleware);
aiRouter.use(aiLimiter);   // also rate-limit all authenticated AI calls


/* =============================================================
   POST /ai/chat
   =============================================================
   WHAT IT DOES:
   Send any question or message and get a Gemini reply.
   Good for: general questions, explanations, brainstorming.

   WHAT GOES IN:
     { "message": "Explain JWT in simple terms" }

   WHAT COMES BACK:
     { "reply": "...", "user": "you@example.com", "model": "gemini-1.5-flash" }

   @swagger
   /ai/chat:
     post:
       summary: Chat with Google Gemini AI
       description: >
         Ask Gemini anything. Protected — requires a valid Bearer JWT
         from POST /auth/login.
       tags:
         - AI
       security:
         - bearerAuth: []
       requestBody:
         required: true
         content:
           application/json:
             schema:
               type: object
               required:
                 - message
               properties:
                 message:
                   type: string
                   example: "What is JWT authentication and why is it secure?"
       responses:
         '200':
           description: Gemini replied successfully
           content:
             application/json:
               schema:
                 type: object
                 properties:
                   reply:
                     type: string
                   user:
                     type: string
                   model:
                     type: string
                     example: gemini-1.5-flash
         '400':
           description: message field is missing or empty
         '401':
           description: Missing or invalid token
         '429':
           description: Too many requests
         '502':
           description: Gemini API error
   ============================================================= */
aiRouter.post('/chat', async (req: Request, res: Response) => {

  const { message } = req.body as { message?: string };

  // Validation — never let an empty message reach Gemini
  if (!message || message.trim() === '') {
    res.status(400).json({ error: '"message" is required and cannot be empty' });
    return;
  }

  // Character cap — stops someone sending a 1 MB payload
  if (message.length > 5_000) {
    res.status(400).json({ error: '"message" must be 5,000 characters or fewer' });
    return;
  }

  try {
    const reply = await chat(message.trim());
    res.status(200).json({
      reply,
      user:  req.user?.email ?? req.user?.id,
      model: 'gemini-1.5-flash',
    });
  } catch (err) {
    console.error('[AI /chat error]', err);
    res.status(502).json({ error: 'AI service error. Please try again.' });
  }
});


/* =============================================================
   POST /ai/summarize
   =============================================================
   WHAT IT DOES:
   Paste a long article, document, or block of text.
   Gemini condenses it to 2–4 clear sentences.

   WHAT GOES IN:
     { "text": "<long text here>" }

   WHAT COMES BACK:
     { "summary": "...", "characters_in": 842, "user": "...", "model": "..." }

   @swagger
   /ai/summarize:
     post:
       summary: Summarise any text using Gemini AI
       description: >
         Paste a long block of text and receive a concise 2–4 sentence
         summary. Protected — requires a valid Bearer JWT.
       tags:
         - AI
       security:
         - bearerAuth: []
       requestBody:
         required: true
         content:
           application/json:
             schema:
               type: object
               required:
                 - text
               properties:
                 text:
                   type: string
                   example: "Supabase is an open-source Firebase alternative..."
       responses:
         '200':
           description: Summary generated
           content:
             application/json:
               schema:
                 type: object
                 properties:
                   summary:
                     type: string
                   characters_in:
                     type: integer
                   user:
                     type: string
                   model:
                     type: string
         '400':
           description: text is missing or too long
         '401':
           description: Missing or invalid token
         '429':
           description: Too many requests
         '502':
           description: Gemini API error
   ============================================================= */
aiRouter.post('/summarize', async (req: Request, res: Response) => {

  const { text } = req.body as { text?: string };

  if (!text || text.trim() === '') {
    res.status(400).json({ error: '"text" is required and cannot be empty' });
    return;
  }

  const MAX = 10_000;
  if (text.length > MAX) {
    res.status(400).json({
      error: `"text" must be ${MAX.toLocaleString()} characters or fewer (received ${text.length.toLocaleString()})`,
    });
    return;
  }

  try {
    const summary = await summarize(text.trim());
    res.status(200).json({
      summary,
      characters_in: text.length,
      user:          req.user?.email ?? req.user?.id,
      model:         'gemini-1.5-flash',
    });
  } catch (err) {
    console.error('[AI /summarize error]', err);
    res.status(502).json({ error: 'AI service error. Please try again.' });
  }
});


/* =============================================================
   POST /ai/generate-bio
   =============================================================
   WHAT IT DOES:
   Generates a professional bio paragraph based on who you are.
   Useful for portfolios, LinkedIn, and developer profiles.

   WHAT GOES IN:
     { "name": "Sam", "role": "Backend Developer" }
     (name and role are optional — email is taken from the JWT)

   WHAT COMES BACK:
     { "bio": "Sam is a skilled backend developer...", "user": "..." }

   WHY THE EMAIL COMES FROM JWT NOT THE BODY:
   This is a security principle — the server gets the user's
   email from the verified token, NOT from req.body.
   A user can't fake someone else's email here.

   @swagger
   /ai/generate-bio:
     post:
       summary: Generate a professional bio using AI
       description: >
         Generates a professional 3–4 sentence bio paragraph.
         Your email is taken from your JWT automatically.
         Optionally provide your name and role for a more
         personalised result. Protected route.
       tags:
         - AI
       security:
         - bearerAuth: []
       requestBody:
         required: false
         content:
           application/json:
             schema:
               type: object
               properties:
                 name:
                   type: string
                   example: "Sam"
                 role:
                   type: string
                   example: "Backend Developer"
       responses:
         '200':
           description: Bio generated successfully
           content:
             application/json:
               schema:
                 type: object
                 properties:
                   bio:
                     type: string
                   user:
                     type: string
                   model:
                     type: string
         '401':
           description: Missing or invalid token
         '429':
           description: Too many requests
         '502':
           description: Gemini API error
   ============================================================= */
aiRouter.post('/generate-bio', async (req: Request, res: Response) => {

  // Email comes from the verified JWT — user cannot forge this
  const email = req.user?.email ?? '';
  const { name, role } = req.body as { name?: string; role?: string };

  try {
    const bio = await generateBio(email, name, role);
    res.status(200).json({
      bio,
      user:  email,
      model: 'gemini-1.5-flash',
    });
  } catch (err) {
    console.error('[AI /generate-bio error]', err);
    res.status(502).json({ error: 'AI service error. Please try again.' });
  }
});


/* =============================================================
   POST /ai/code-review
   =============================================================
   WHAT IT DOES:
   Paste any code snippet. Gemini acts as a senior engineer
   and gives you: a summary, a list of issues, specific
   improvement suggestions, and a quality score out of 10.

   WHAT GOES IN:
     { "code": "function add(a,b){ return a+b }", "language": "JavaScript" }

   WHAT COMES BACK:
     {
       "summary": "Simple addition function, missing type safety",
       "issues": ["No type annotations", "No input validation"],
       "suggestions": ["Use TypeScript", "Validate inputs"],
       "score": 5,
       "language": "JavaScript",
       "user": "..."
     }

   @swagger
   /ai/code-review:
     post:
       summary: Get an AI code review
       description: >
         Paste any code snippet and receive a structured review from
         Gemini acting as a senior software engineer. Returns issues,
         suggestions, and a quality score out of 10. Protected route.
       tags:
         - AI
       security:
         - bearerAuth: []
       requestBody:
         required: true
         content:
           application/json:
             schema:
               type: object
               required:
                 - code
               properties:
                 code:
                   type: string
                   example: "function login(user, pass) { if(user == 'admin' && pass == '1234') return true; }"
                 language:
                   type: string
                   example: "JavaScript"
       responses:
         '200':
           description: Code review returned
           content:
             application/json:
               schema:
                 type: object
                 properties:
                   summary:
                     type: string
                   issues:
                     type: array
                     items:
                       type: string
                   suggestions:
                     type: array
                     items:
                       type: string
                   score:
                     type: integer
                   language:
                     type: string
                   user:
                     type: string
         '400':
           description: code field is missing
         '401':
           description: Missing or invalid token
         '429':
           description: Too many requests
         '502':
           description: Gemini API error
   ============================================================= */
aiRouter.post('/code-review', async (req: Request, res: Response) => {

  const { code, language = 'unknown' } = req.body as {
    code?: string;
    language?: string;
  };

  if (!code || code.trim() === '') {
    res.status(400).json({ error: '"code" is required and cannot be empty' });
    return;
  }

  if (code.length > 8_000) {
    res.status(400).json({ error: '"code" must be 8,000 characters or fewer' });
    return;
  }

  try {
    const review = await reviewCode(code.trim(), language);
    res.status(200).json({
      ...review,
      language,
      user:  req.user?.email ?? req.user?.id,
      model: 'gemini-1.5-flash',
    });
  } catch (err) {
    console.error('[AI /code-review error]', err);
    res.status(502).json({ error: 'AI service error. Please try again.' });
  }
});


/* =============================================================
   POST /ai/translate
   =============================================================
   WHAT IT DOES:
   Translates any text into any language you specify.
   Just send the text and say what language you want.

   WHAT GOES IN:
     { "text": "Hello, how are you?", "targetLanguage": "French" }

   WHAT COMES BACK:
     { "translation": "Bonjour, comment allez-vous?", "targetLanguage": "French", "user": "..." }

   @swagger
   /ai/translate:
     post:
       summary: Translate text to any language using AI
       description: >
         Send any text and specify a target language (e.g. "French",
         "Spanish", "Yoruba"). Gemini returns only the translated text.
         Protected route — requires Bearer JWT.
       tags:
         - AI
       security:
         - bearerAuth: []
       requestBody:
         required: true
         content:
           application/json:
             schema:
               type: object
               required:
                 - text
                 - targetLanguage
               properties:
                 text:
                   type: string
                   example: "Welcome to the AI Auth API!"
                 targetLanguage:
                   type: string
                   example: "French"
       responses:
         '200':
           description: Translation successful
           content:
             application/json:
               schema:
                 type: object
                 properties:
                   translation:
                     type: string
                   targetLanguage:
                     type: string
                   user:
                     type: string
                   model:
                     type: string
         '400':
           description: text or targetLanguage missing
         '401':
           description: Missing or invalid token
         '429':
           description: Too many requests
         '502':
           description: Gemini API error
   ============================================================= */
aiRouter.post('/translate', async (req: Request, res: Response) => {

  const { text, targetLanguage } = req.body as {
    text?: string;
    targetLanguage?: string;
  };

  if (!text || text.trim() === '') {
    res.status(400).json({ error: '"text" is required' });
    return;
  }

  if (!targetLanguage || targetLanguage.trim() === '') {
    res.status(400).json({ error: '"targetLanguage" is required (e.g. "French", "Yoruba")' });
    return;
  }

  if (text.length > 5_000) {
    res.status(400).json({ error: '"text" must be 5,000 characters or fewer' });
    return;
  }

  try {
    const translation = await translate(text.trim(), targetLanguage.trim());
    res.status(200).json({
      translation,
      targetLanguage: targetLanguage.trim(),
      user:           req.user?.email ?? req.user?.id,
      model:          'gemini-1.5-flash',
    });
  } catch (err) {
    console.error('[AI /translate error]', err);
    res.status(502).json({ error: 'AI service error. Please try again.' });
  }
});


/* =============================================================
   GET /ai/tip
   =============================================================
   WHAT IT DOES:
   Returns a random, genuinely useful security or backend
   development best-practice tip from Gemini.
   No input needed — just hit the endpoint and get a tip.

   WHAT COMES BACK:
     {
       "tip": "Always hash passwords with bcrypt...",
       "category": "Password Hygiene",
       "source": "OWASP Top 10",
       "user": "..."
     }

   WHY THIS IS USEFUL FOR LEARNING:
   Each time you call it, Gemini picks a different topic —
   CORS, JWT, SQL injection, rate limiting, etc.
   It's like a daily developer lesson.

   @swagger
   /ai/tip:
     get:
       summary: Get a random AI security or dev tip
       description: >
         Returns a random, practical security or backend development
         best-practice tip generated by Gemini. No input needed.
         A new tip is generated on every call. Protected route.
       tags:
         - AI
       security:
         - bearerAuth: []
       responses:
         '200':
           description: Tip generated
           content:
             application/json:
               schema:
                 type: object
                 properties:
                   tip:
                     type: string
                   category:
                     type: string
                     example: JWT Security
                   source:
                     type: string
                     example: RFC 7519
                   user:
                     type: string
                   model:
                     type: string
         '401':
           description: Missing or invalid token
         '429':
           description: Too many requests
         '502':
           description: Gemini API error
   ============================================================= */
aiRouter.get('/tip', async (req: Request, res: Response) => {

  try {
    const tipData = await getSecurityTip();
    res.status(200).json({
      ...tipData,
      user:  req.user?.email ?? req.user?.id,
      model: 'gemini-1.5-flash',
    });
  } catch (err) {
    console.error('[AI /tip error]', err);
    res.status(502).json({ error: 'AI service error. Please try again.' });
  }
});


export default aiRouter;
