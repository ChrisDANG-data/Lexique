import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId, unauthorized } from "@/lib/session";
import { buildWordWhere, SESSION_SIZE } from "@/lib/words";
import { FrenchGender, Language } from "@/generated/prisma/client";

export type GenderCard = {
  id: string;
  text: string;
  gender: "M" | "F";
  translationEn: string | null;
  translationZh: string;
};

/**
 * Gender drill: a shuffled set of French words that have a masculine or
 * feminine gender. Practice only — does not change the word's SRS schedule.
 */
export async function GET(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const sp = req.nextUrl.searchParams;
  const where = buildWordWhere({
    userId,
    language: Language.FR,
    tag: sp.get("tag") ?? undefined,
    q: sp.get("q") ?? undefined,
  });
  where.gender = { in: [FrenchGender.M, FrenchGender.F] };

  const words = await prisma.word.findMany({
    where,
    select: {
      id: true,
      text: true,
      gender: true,
      translationEn: true,
      translationZh: true,
    },
  });

  // Fisher–Yates shuffle, then take one session's worth.
  for (let i = words.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [words[i], words[j]] = [words[j], words[i]];
  }

  const cards = words.slice(0, SESSION_SIZE) as GenderCard[];
  return NextResponse.json({ cards, available: words.length });
}
