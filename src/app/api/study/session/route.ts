import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildWordWhere, SESSION_SIZE, toStudyPrompt } from "@/lib/words";
import { PartOfSpeech } from "@/generated/prisma/client";

/** Build a 20-card session: failed first, then due, then newest. */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const language =
    sp.get("language") === "EN" || sp.get("language") === "FR"
      ? sp.get("language")
      : undefined;
  const pos = sp.get("pos");
  const tag = sp.get("tag") ?? undefined;
  const q = sp.get("q") ?? undefined;
  const baseWhere = buildWordWhere({ language: language as any, tag, q });

  if (pos && Object.values(PartOfSpeech).includes(pos as PartOfSpeech)) {
    baseWhere.pos = pos as PartOfSpeech;
  }

  const now = new Date();

  const failed = await prisma.word.findMany({
    where: { ...baseWhere, isFailed: true },
    orderBy: [{ failCount: "desc" }, { dueAt: "asc" }],
    take: SESSION_SIZE,
  });

  const remaining = SESSION_SIZE - failed.length;
  const failedIds = failed.map((w) => w.id);

  const due =
    remaining > 0
      ? await prisma.word.findMany({
          where: {
            ...baseWhere,
            isFailed: false,
            dueAt: { lte: now },
            id: { notIn: failedIds },
          },
          orderBy: { dueAt: "asc" },
          take: remaining,
        })
      : [];

  const stillNeed = SESSION_SIZE - failed.length - due.length;
  const usedIds = [...failedIds, ...due.map((w) => w.id)];

  const filler =
    stillNeed > 0
      ? await prisma.word.findMany({
          where: { ...baseWhere, id: { notIn: usedIds } },
          orderBy: { createdAt: "desc" },
          take: stillNeed,
        })
      : [];

  const cards = [...failed, ...due, ...filler].map((w) => {
    const prompt = toStudyPrompt(w);
    return {
      id: prompt.id,
      definition: prompt.definition,
      language: prompt.language,
      pos: prompt.pos,
      gender: prompt.gender,
      note: w.note ?? "",
    };
  });
  return NextResponse.json({ cards, sessionSize: SESSION_SIZE });
}
