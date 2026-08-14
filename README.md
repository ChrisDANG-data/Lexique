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

Accounts are stored in the database.

- **Existing username** → sign in with your password  
- **New username** → enter username + password; account is **created automatically** on first sign-in  
- Suggested first account: `admin` / `lexique` (pre-filled on `/login`)

Optional: set `AUTH_SECRET` on Vercel for a custom JWT secret.

## V1 features

- Add word/phrase → detect EN/FR (same spelling → EN) → reject typos → enrich → upsert
- French gender, definitions, examples, synonyms, antonyms, FR/EN + ZH translations
- Study session of 20: show definition → type the word (exact match), failed prioritized, SM-2 SRS
- Browse/search/filter; CSV + Anki TSV import/export
