import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { answersMatch } from "@/lib/normalize";
import { applySrs } from "@/lib/srs";
import { ReviewResult } from "@/generated/prisma/client";

const BodySchema = z.object({
  wordId: z.string().min(1),
  answer: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = BodySchema.parse(await req.json());
    const word = await prisma.word.findUnique({ where: { id: body.wordId } });
    if (!word) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const passed = answersMatch(word.text, body.answer);

    const srs = applySrs(
      {
        easeFactor: word.easeFactor,
        intervalDays: word.intervalDays,
        repetitions: word.repetitions,
      },
      passed,
    );

    const [updated] = await prisma.$transaction([
      prisma.word.update({
        where: { id: word.id },
        data: {
          easeFactor: srs.easeFactor,
          intervalDays: srs.intervalDays,
          repetitions: srs.repetitions,
          dueAt: srs.dueAt,
          isFailed: srs.isFailed,
          failCount: { increment: srs.failCountDelta },
          lastResult: srs.lastResult as ReviewResult,
          lastReviewedAt: new Date(),
        },
      }),
      prisma.review.create({
        data: {
          wordId: word.id,
          result: passed ? ReviewResult.PASS : ReviewResult.FAIL,
          userAnswer: body.answer,
        },
      }),
    ]);

    return NextResponse.json({
      passed,
      expectedWord: word.text,
      definition: word.definition,
      pos: word.pos,
      translationEn: word.translationEn,
      translationFr: word.translationFr,
      translationZh: word.translationZh,
      gender: word.gender,
      note: word.note,
      word: updated,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Review failed";
    return NextResponse.json({ error: "server_error", reason: message }, { status: 500 });
  }
}
