/* =============================================================
   Gemini AI Client — Full Edition
   =============================================================
   The single file that owns ALL Gemini logic.
   Routes call the exported functions and never touch the SDK.

   Exports
   ───────
   chat(message)           – single-turn conversational reply
   summarize(text)         – concise 2-4 sentence summary
   analyzePassword(pwd)    – security strength report
   generateBio(email,name) – professional bio paragraph
   reviewCode(code, lang)  – code review + suggestions
   translate(text, lang)   – translate to any language
   getSecurityTip()        – random security or dev best-practice tip
   ============================================================= */

import process from 'node:process';
import { GoogleGenerativeAI, GenerationConfig } from '@google/generative-ai';

const geminiApiKey = process.env.GEMINI_API_KEY;
const groqApiKey   = process.env.GROQ_API_KEY;

/* ── Generation defaults ─────────────────────────────────── */
const DEFAULT_CONFIG: GenerationConfig = {
  temperature:     0.7,
  topP:            0.9,
  maxOutputTokens: 1024,
};

async function callGroq(prompt: string, apiKey: string, temperature = 0.7): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-120b',
      messages: [{ role: 'user', content: prompt }],
      temperature,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API error (${res.status}): ${errText}`);
  }

  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('Groq returned an empty response');
  return text;
}

async function callGemini(prompt: string, apiKey: string, config?: Partial<GenerationConfig>): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey.trim());
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: { ...DEFAULT_CONFIG, ...config },
  });
  const result = await model.generateContent(prompt);
  const text   = result.response.text().trim();
  if (!text) throw new Error('Gemini returned an empty response');
  return text;
}

async function callGrok(prompt: string, apiKey: string, temperature = 0.7): Promise<string> {
  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: 'grok-2-latest',
      messages: [{ role: 'user', content: prompt }],
      temperature,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`xAI Grok error (${res.status}): ${errText}`);
  }

  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('Grok returned an empty response');
  return text;
}

/** Helper – run a prompt via Groq, Grok, or Gemini */
async function run(prompt: string, config?: Partial<GenerationConfig>): Promise<string> {
  const groq = process.env.GROQ_API_KEY;
  if (groq) {
    return callGroq(prompt, groq, config?.temperature ?? 0.7);
  }

  const grok = process.env.GROK_API_KEY ?? process.env.XAI_API_KEY;
  if (grok) {
    return callGrok(prompt, grok, config?.temperature ?? 0.7);
  }

  const gemini = process.env.GEMINI_API_KEY;
  if (gemini) {
    return callGemini(prompt, gemini, config);
  }

  throw new Error(
    'No AI API key found! Add GROQ_API_KEY or GROK_API_KEY to your .env file.\n' +
    '• Free Groq key in 10s: https://console.groq.com/keys'
  );
}


/* =============================================================
   chat()   – single-turn Q&A
   ============================================================= */
export async function chat(message: string): Promise<string> {
  return run(
    `You are a helpful, concise assistant. Answer the following:\n\n${message}`,
    { temperature: 0.7 }
  );
}


/* =============================================================
   summarize()   – condense text into 2-4 sentences
   ============================================================= */
export async function summarize(text: string): Promise<string> {
  return run(
    `Summarise the following text in 2–4 clear sentences. ` +
    `Be factual and concise.\n\nText:\n${text}`,
    { temperature: 0.3 }   // lower temperature = more factual
  );
}


/* =============================================================
   analyzePassword()   – AI security strength report
   Input:  password string (we never store or log this)
   Output: structured plain-English security report
   ============================================================= */
export async function analyzePassword(password: string): Promise<{
  score:       number;      // 0-10
  strength:    string;      // "Weak" | "Fair" | "Strong" | "Excellent"
  feedback:    string[];    // specific improvement suggestions
  verdict:     string;      // one paragraph summary
}> {
  const prompt = `
You are a cybersecurity expert. Analyse this password for security strength.
DO NOT repeat or reveal the password in your response.

Password: "${password}"

Respond ONLY with valid JSON in this exact structure (no markdown, no explanation outside the JSON):
{
  "score": <integer 0-10>,
  "strength": "<Weak|Fair|Strong|Excellent>",
  "feedback": ["<tip 1>", "<tip 2>", "<tip 3>"],
  "verdict": "<one concise paragraph summarising the password security>"
}
`.trim();

  const raw = await run(prompt, { temperature: 0.2 });

  // strip any accidental markdown code fences
  const cleaned = raw.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();

  try {
    return JSON.parse(cleaned) as {
      score: number; strength: string; feedback: string[]; verdict: string;
    };
  } catch {
    // If AI returned non-JSON, wrap it gracefully
    return {
      score:    5,
      strength: 'Unknown',
      feedback: ['Could not parse AI response – try again.'],
      verdict:  raw,
    };
  }
}


/* =============================================================
   generateBio()   – write a professional bio for the user
   Input:  email (required), name (optional), role (optional)
   Output: a 3-4 sentence professional bio paragraph
   ============================================================= */
export async function generateBio(
  email: string,
  name?: string,
  role?: string
): Promise<string> {
  const identity = name  ? `Name: ${name}`  : `Email handle: ${email.split('@')[0]}`;
  const jobTitle = role  ? `Role: ${role}`  : '';

  return run(
    `Write a professional 3–4 sentence bio for a tech professional.\n` +
    `${identity}\n${jobTitle}\n` +
    `Make it sound confident, modern, and suitable for a LinkedIn profile or API developer portfolio. ` +
    `Do not invent specific companies or credentials.`,
    { temperature: 0.8 }
  );
}


/* =============================================================
   reviewCode()   – AI code review with suggestions
   Input:  code snippet (string), language name (optional)
   Output: structured review with issues + suggestions
   ============================================================= */
export async function reviewCode(code: string, language = 'unknown'): Promise<{
  summary:     string;
  issues:      string[];
  suggestions: string[];
  score:       number;   // 0-10 quality score
}> {
  const prompt = `
You are a senior software engineer doing a code review.
Language: ${language}

Code:
\`\`\`
${code}
\`\`\`

Respond ONLY with valid JSON (no markdown outside the JSON):
{
  "summary": "<one sentence overall assessment>",
  "issues": ["<issue 1>", "<issue 2>"],
  "suggestions": ["<suggestion 1>", "<suggestion 2>"],
  "score": <integer 0-10 quality score>
}
`.trim();

  const raw     = await run(prompt, { temperature: 0.3 });
  const cleaned = raw.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();

  try {
    return JSON.parse(cleaned) as {
      summary: string; issues: string[]; suggestions: string[]; score: number;
    };
  } catch {
    return {
      summary:     raw,
      issues:      [],
      suggestions: ['Could not parse structured review – see summary.'],
      score:       5,
    };
  }
}


/* =============================================================
   translate()   – translate text to any target language
   Input:  text (string), targetLanguage (e.g. "French")
   Output: translated string
   ============================================================= */
export async function translate(
  text: string,
  targetLanguage: string
): Promise<string> {
  return run(
    `Translate the following text to ${targetLanguage}. ` +
    `Return ONLY the translated text with no preamble or explanation.\n\n` +
    `Text:\n${text}`,
    { temperature: 0.2 }
  );
}


/* =============================================================
   getSecurityTip()   – random security / dev best-practice tip
   Output: { tip: string, category: string }
   ============================================================= */
export async function getSecurityTip(): Promise<{
  tip:      string;
  category: string;
  source:   string;
}> {
  const prompt = `
Give me one random, practical security or software development best-practice tip.
It should be genuinely useful for a backend developer.

Respond ONLY with valid JSON (no markdown outside):
{
  "tip": "<the tip in 1-3 sentences>",
  "category": "<e.g. Authentication | API Security | Password Hygiene | JWT | CORS | Rate Limiting | etc.>",
  "source": "<a real standard or resource this is based on, e.g. OWASP Top 10, RFC 7519, etc.>"
}
`.trim();

  const raw     = await run(prompt, { temperature: 0.9 });
  const cleaned = raw.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();

  try {
    return JSON.parse(cleaned) as { tip: string; category: string; source: string };
  } catch {
    return { tip: raw, category: 'General', source: 'Gemini AI' };
  }
}
