-- CreateEnum
CREATE TYPE "Language" AS ENUM ('EN', 'FR');

-- CreateEnum
CREATE TYPE "FrenchGender" AS ENUM ('M', 'F', 'N');

-- CreateEnum
CREATE TYPE "ReviewResult" AS ENUM ('PASS', 'FAIL');

-- CreateTable
CREATE TABLE "Word" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "lemma" TEXT NOT NULL,
    "language" "Language" NOT NULL,
    "definition" TEXT NOT NULL,
    "examples" TEXT[],
    "synonyms" TEXT[],
    "antonyms" TEXT[],
    "translationEn" TEXT,
    "translationFr" TEXT,
    "translationZh" TEXT NOT NULL,
    "gender" "FrenchGender",
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "easeFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "intervalDays" INTEGER NOT NULL DEFAULT 0,
    "repetitions" INTEGER NOT NULL DEFAULT 0,
    "dueAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "failCount" INTEGER NOT NULL DEFAULT 0,
    "isFailed" BOOLEAN NOT NULL DEFAULT false,
    "lastResult" "ReviewResult",
    "lastReviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Word_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "result" "ReviewResult" NOT NULL,
    "userAnswer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Word_language_idx" ON "Word"("language");

-- CreateIndex
CREATE INDEX "Word_isFailed_idx" ON "Word"("isFailed");

-- CreateIndex
CREATE INDEX "Word_dueAt_idx" ON "Word"("dueAt");

-- CreateIndex
CREATE INDEX "Word_createdAt_idx" ON "Word"("createdAt");

-- CreateIndex
CREATE INDEX "Word_tags_idx" ON "Word"("tags");

-- CreateIndex
CREATE UNIQUE INDEX "Word_lemma_language_key" ON "Word"("lemma", "language");

-- CreateIndex
CREATE INDEX "Review_wordId_idx" ON "Review"("wordId");

-- CreateIndex
CREATE INDEX "Review_createdAt_idx" ON "Review"("createdAt");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;
