-- CreateEnum
CREATE TYPE "PartOfSpeech" AS ENUM ('N', 'V', 'ADJ', 'ADV', 'PREP', 'CONJ', 'PRON', 'DET', 'INTERJ', 'PHRASE', 'OTHER');

-- AlterTable
ALTER TABLE "Word" ADD COLUMN     "pos" "PartOfSpeech" NOT NULL DEFAULT 'OTHER';

-- CreateIndex
CREATE INDEX "Word_pos_idx" ON "Word"("pos");
