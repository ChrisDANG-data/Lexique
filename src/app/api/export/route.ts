import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { wordsToAnkiTsv, wordsToCsv } from "@/lib/import-export";
import { buildWordWhere } from "@/lib/words";
import { Language } from "@/generated/prisma/client";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const format = sp.get("format") === "anki" ? "anki" : "csv";
  const languageParam = sp.get("language");
  const language =
    languageParam === "EN" || languageParam === "FR"
      ? (languageParam as Language)
      : undefined;

  const words = await prisma.word.findMany({
    where: buildWordWhere({
      q: sp.get("q") ?? undefined,
      language,
      failedOnly: sp.get("failedOnly") === "1",
      tag: sp.get("tag") ?? undefined,
    }),
    orderBy: { lemma: "asc" },
  });

  if (format === "anki") {
    return new NextResponse(wordsToAnkiTsv(words), {
      headers: {
        "Content-Type": "text/tab-separated-values; charset=utf-8",
        "Content-Disposition": 'attachment; filename="vocab-anki.tsv"',
      },
    });
  }

  return new NextResponse(wordsToCsv(words), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="vocab.csv"',
    },
  });
}
