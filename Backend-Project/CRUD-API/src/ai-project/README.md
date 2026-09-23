# AI Auth API — Express + TypeScript + Supabase + Google Gemini

An independent, AI-generated authentication API with **real AI-powered routes**.
Built with **Express**, **TypeScript**, **Supabase Auth**, and **Google Gemini AI**.

> This project lives entirely inside `src/ai-project/` and never touches any other file in the parent project.

---

## What this project does

This is a backend API that combines two things:

1. **Secure authentication** — users can sign up, log in, refresh tokens, and log out. All JWTs are verified on the server using Supabase — the backend never trusts the client.

2. **Real AI features** — once logged in, users can chat with Gemini AI, summarise text, analyse password strength, get a professional bio written, review code, translate text, and get security tips. All AI calls are protected — your API key is never exposed.

```
Client → POST /auth/login → gets JWT token
Client → POST /ai/chat   → Backend verifies JWT → calls Google Gemini → returns AI reply
```

---

## Project structure

```
src/ai-project/
│
├── index.ts                          ← Front door: starts server, wires everything together
├── supabase.ts                       ← Supabase client (reads from env vars only)
├── .env.example                      ← Template — copy values into root .env
│
├── ai/
│   └── gemini.ts                     ← ALL Gemini logic lives here (7 exported functions)
│                                        chat() · summarize() · analyzePassword()
│                                        generateBio() · reviewCode() · translate() · getSecurityTip()
│
├── middleware/
│   ├── auth.middleware.ts            ← Verifies Bearer JWT via Supabase before protected routes
│   ├── logger.middleware.ts          ← Logs every request (method, path, status, time, user)
│   ├── rate-limit.middleware.ts      ← 3 rate limiters: AI (20/15min), Auth (10/15min), General (100/15min)
│   └── error.middleware.ts           ← Global error handler — catches crashes, returns clean JSON
│
├── routes/
│   ├── auth.routes.ts                ← POST /auth/signup, /login, /logout, /refresh
│   ├── protected.routes.ts           ← GET  /protected/profile, /dashboard
│   └── ai.routes.ts                  ← POST /ai/chat, /summarize, /analyze-password,
│                                           /generate-bio, /code-review, /translate
│                                        GET  /ai/tip
│
└── types/
    └── express.d.ts                  ← Teaches TypeScript that req.user and req.token exist
```

---

## All routes at a glance

| Method | Route | Auth required | Description |
|--------|-------|:---:|-------------|
| `GET` | `/` | ❌ | API info and full route map |
| `GET` | `/health` | ❌ | Liveness check |
| `GET` | `/docs` | ❌ | Swagger UI — interactive API explorer |
| `POST` | `/auth/signup` | ❌ | Register a new account |
| `POST` | `/auth/login` | ❌ | Login → get `access_token` + `refresh_token` |
| `POST` | `/auth/refresh` | ❌ | Exchange a `refresh_token` for a new `access_token` |
| `POST` | `/auth/logout` | ✅ | Sign out (invalidates session in Supabase) |
| `GET` | `/protected/profile` | ✅ | Your verified profile from Supabase |
| `GET` | `/protected/dashboard` | ✅ | Personalised dashboard with account stats |
| `POST` | `/ai/analyze-password` | ❌ | AI password strength report — score, feedback, verdict |
| `POST` | `/ai/chat` | ✅ | Chat with Google Gemini AI |
| `POST` | `/ai/summarize` | ✅ | Summarise any text in 2–4 sentences |
| `POST` | `/ai/generate-bio` | ✅ | AI writes your professional bio |
| `POST` | `/ai/code-review` | ✅ | AI reviews your code — issues, suggestions, score |
| `POST` | `/ai/translate` | ✅ | Translate text to any language |
| `GET` | `/ai/tip` | ✅ | Random security or dev best-practice tip from AI |

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Get your API keys

**Supabase** (free at [supabase.com](https://supabase.com)):
1. Open your project → **Settings → API**
2. Copy **Project URL** → `SUPABASE_URL`
3. Copy **service_role** secret key → `SUPABASE_SECRET_KEY`

**Google Gemini** (free at [aistudio.google.com/apikey](https://aistudio.google.com/apikey)):
1. Click **Create API Key**
2. Copy the key → `GEMINI_API_KEY`

### 3. Set environment variables

Add these to the root `.env` file (same folder as `package.json`):

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SECRET_KEY=your-service-role-key-here
GEMINI_API_KEY=your-gemini-api-key-here
PORT=4000
```

> ⚠️ Never commit `.env` to GitHub. It's already in `.gitignore`.

### 4. Start the server

```bash
npm run dev:ai
```

Expected output:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🚀  AI Auth API v2 started
  🌐  Server:    http://localhost:4000
  📖  Swagger:   http://localhost:4000/docs
  ❤️   Health:    http://localhost:4000/health
  🤖  AI routes: http://localhost:4000/ai/chat
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## How to test — Swagger UI (easiest)

1. Open **http://localhost:4000/docs**
2. Under **Auth** → run `POST /auth/signup` to create an account
3. Run `POST /auth/login` → copy the `access_token` from the response
4. Click 🔒 **Authorize** at the top right → paste the token → **Authorize**
5. Now call any protected or AI route — the token is sent automatically

---

## How to test — curl

### Auth flow

```bash
# 1. Sign up
curl -X POST http://localhost:4000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"MyPassword123!"}'

# 2. Login — copy the access_token from the response
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"MyPassword123!"}'

# 3. Refresh token when access_token expires
curl -X POST http://localhost:4000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"YOUR_REFRESH_TOKEN"}'

# 4. Logout
curl -X POST http://localhost:4000/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### AI routes

```bash
# Analyze password — no token needed
curl -X POST http://localhost:4000/ai/analyze-password \
  -H "Content-Type: application/json" \
  -d '{"password":"MyP@ssword123"}'

# Chat with Gemini
curl -X POST http://localhost:4000/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"message":"What is JWT and why is it secure?"}'

# Summarise text
curl -X POST http://localhost:4000/ai/summarize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"text":"Supabase is an open-source Firebase alternative built on PostgreSQL..."}'

# Generate professional bio
curl -X POST http://localhost:4000/ai/generate-bio \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"name":"Sam","role":"Backend Developer"}'

# Code review
curl -X POST http://localhost:4000/ai/code-review \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"code":"function add(a,b){ return a+b }","language":"JavaScript"}'

# Translate text
curl -X POST http://localhost:4000/ai/translate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"text":"Hello, welcome to the API!","targetLanguage":"French"}'

# Get a security tip
curl http://localhost:4000/ai/tip \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Status codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Created (signup) |
| `204` | No content (logout) |
| `400` | Missing or invalid input |
| `401` | Missing, invalid, or expired token / wrong credentials |
| `429` | Too many requests — rate limit hit |
| `502` | Gemini AI service error |

---

## Security features

| Feature | How it's implemented |
|---------|---------------------|
| JWT verification | `supabase.auth.getUser(token)` — server-side, never trusts the client |
| API key protection | `GEMINI_API_KEY` and `SUPABASE_SECRET_KEY` in `.env` only |
| Rate limiting | AI: 20 req/15min · Auth: 10 req/15min · General: 100 req/15min |
| Input validation | Every route checks required fields before calling any external service |
| Character limits | Chat: 5,000 · Summarize/Translate: 5,000–10,000 · Code: 8,000 |
| CORS | Enabled globally so Swagger UI and browser clients can connect |
| Global error handler | All unhandled errors return clean JSON — stack traces hidden in production |
| Brute-force protection | Auth limiter blocks excessive login/signup attempts |

---

## Comparing AI project vs Manual implementation

| Feature | Manual (`src/index.ts`) | AI (`src/ai-project/`) |
|---------|------------------------|------------------------|
| Port | 3000 | 4000 |
| Project structure | Single file | Modular — routes / middleware / ai |
| Auth provider | Supabase | Supabase |
| Token refresh route | ❌ | ✅ `POST /auth/refresh` |
| Request logging | ❌ | ✅ Logger middleware |
| Rate limiting | ❌ | ✅ 3-tier rate limiter |
| CORS | ❌ | ✅ |
| Global error handler | ❌ | ✅ |
| AI routes | ❌ None | ✅ 7 AI-powered endpoints |
| AI provider | ❌ None | Google Gemini 1.5 Flash |
| Swagger | `/docs` | `/docs` |
| Password analysis | ❌ | ✅ AI-powered, with score + feedback |
| Code review | ❌ | ✅ AI-powered |
| Translation | ❌ | ✅ Any language |
