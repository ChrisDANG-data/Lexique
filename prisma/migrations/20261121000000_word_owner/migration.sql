-- Each word now belongs to a user.

-- DropIndex
DROP INDEX "Word_lemma_language_key";

-- AlterTable: add as nullable first so existing rows can be backfilled
ALTER TABLE "Word" ADD COLUMN "userId" TEXT;

-- Backfill: if words exist but no user does, create the legacy "admin" account
-- (password "lexique" — change it after signing in).
INSERT INTO "User" ("id", "username", "displayName", "passwordHash", "createdAt")
SELECT 'legacy_admin', 'admin', 'admin',
       '$2b$10$mKW.cRTNBsNbRDYZrk4tP.YbnDmkw7g3Srrh/t2ti/kV56aFeTMHG',
       CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM "Word")
  AND NOT EXISTS (SELECT 1 FROM "User");

-- Assign all pre-existing words to the "admin" user if present, else the oldest user.
UPDATE "Word"
SET "userId" = (
  SELECT "id" FROM "User"
  ORDER BY ("username" = 'admin') DESC, "createdAt" ASC
  LIMIT 1
)
WHERE "userId" IS NULL;

ALTER TABLE "Word" ALTER COLUMN "userId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Word_userId_idx" ON "Word"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Word_userId_lemma_language_key" ON "Word"("userId", "lemma", "language");

-- AddForeignKey
ALTER TABLE "Word" ADD CONSTRAINT "Word_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
