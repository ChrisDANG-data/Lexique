# Lex Dual — FR / EN Vocabulary

Learn French and English vocabulary with LLM enrichment, PostgreSQL storage, flashcard tests, and Anki-style spaced repetition.

## Stack

- Next.js (App Router) on Vercel
- PostgreSQL via Prisma 7
- OpenAI-compatible LLM (Ollama local or cloud)

## Setup

1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL` (Neon), `AUTH_SECRET`, and `LLM_*`.
3. Install and migrate:

```bash
npm install
npx prisma migrate dev
npm run dev
```

Open the app → create an account at `/register` (or sign in at `/login`).

For a local LLM with Ollama:

```bash
ollama pull llama3.2
# LLM_BASE_URL=http://127.0.0.1:11434/v1
```

## Auth

Each user has their own account and their own vocabulary list, study progress and review history.

- **Register** at `/register`: username (3–32 chars: letters, numbers, `.` `-` `_`), optional display name, password (8+ chars). Passwords are stored as bcrypt hashes.
- **Sign in** at `/login`. Unknown usernames are rejected — accounts are only created via registration.
- All pages and API routes require a session (enforced in `src/proxy.ts` and in each route handler); every word query is scoped to the signed-in user.
- Words that existed before per-user accounts were assigned to the `admin` user by the `word_owner` migration.

**Required in production:** set `AUTH_SECRET` (e.g. `npx auth secret`). A built-in fallback is used only in development.

## V1 features

- Add word/phrase → detect EN/FR (same spelling → EN) → reject typos → enrich → upsert
- French gender, definitions, examples, synonyms, antonyms, FR/EN + ZH translations
- Study session of 20: show definition → type the word (exact match), failed prioritized, SM-2 SRS
- Browse/search/filter; CSV + Anki TSV import/export
