# Lex Dual — FR / EN Vocabulary

Learn French and English vocabulary with LLM enrichment, PostgreSQL storage, flashcard tests, and Anki-style spaced repetition.

## Stack

- Next.js (App Router) on Vercel
- PostgreSQL via Prisma 7
- OpenAI-compatible LLM (Ollama local or cloud)

## Setup

1. Copy `.env.example` to `.env`.
2. In [Neon](https://console.neon.tech) → your project → **Connection details**, copy the Postgres connection string into `DATABASE_URL` (include `?sslmode=require`). Prefer the **direct** (non-pooler) URL for `prisma migrate`.
3. Set `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`.
4. Install and migrate:

```bash
npm install
npx prisma migrate dev --name init
npm run dev
```

3. For a local LLM with Ollama:

```bash
ollama pull llama3.2
# LLM_BASE_URL=http://127.0.0.1:11434/v1
```

## V1 features

- Add word/phrase → detect EN/FR (same spelling → EN) → reject typos → enrich → upsert
- French gender, definitions, examples, synonyms, antonyms, FR/EN + ZH translations
- Study session of 20: show definition → type the word (exact match), failed prioritized, SM-2 SRS
- Browse/search/filter; CSV + Anki TSV import/export
