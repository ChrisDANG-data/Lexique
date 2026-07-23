# Lex Dual — FR / EN Vocabulary

Learn French and English vocabulary with LLM enrichment, PostgreSQL storage, flashcard tests, and Anki-style spaced repetition.

## Stack

- Next.js (App Router) on Vercel
- PostgreSQL via Prisma 7
- OpenAI-compatible LLM (Ollama local or cloud)

## Setup

1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL` (Neon), `AUTH_SECRET` / `AUTH_USERNAME` / `AUTH_PASSWORD`, and `LLM_*`.
3. Install and migrate:

```bash
npm install
npx prisma migrate dev
npm run dev
```

Open the app → sign in at `/login`.

For a local LLM with Ollama:

```bash
ollama pull llama3.2
# LLM_BASE_URL=http://127.0.0.1:11434/v1
```

## Auth

Set these in `.env` (local) and Vercel → Environment Variables:

- `AUTH_SECRET` — long random string
- `AUTH_USERNAME` — your login name
- `AUTH_PASSWORD` — your password

Without them, the app redirects everyone to `/login`.

## V1 features

- Add word/phrase → detect EN/FR (same spelling → EN) → reject typos → enrich → upsert
- French gender, definitions, examples, synonyms, antonyms, FR/EN + ZH translations
- Study session of 20: show definition → type the word (exact match), failed prioritized, SM-2 SRS
- Browse/search/filter; CSV + Anki TSV import/export
