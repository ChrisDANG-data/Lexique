import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { parseAnkiTsv, parseCsvImport } from "@/lib/import-export";
import { normalizeLemma } from "@/lib/normalize";
import { FrenchGender, Language, PartOfSpeech } from "@/generated/prisma/client";

const BodySchema = z.object({
  format: z.enum(["csv", "anki"]),
  content: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = BodySchema.parse(await req.json());
    const rows =
      body.format === "csv" ? parseCsvImport(body.content) : parseAnkiTsv(body.content);

    let upserted = 0;
    for (const row of rows) {
      if (!row.translationZh && !row.definition) continue;
      const language = row.language as Language;
      const lemma = normalizeLemma(row.text);

      await prisma.word.upsert({
        where: { lemma_language: { lemma, language } },
        create: {
          text: row.text.trim(),
          lemma,
          language,
          pos: (row.pos as PartOfSpeech) || PartOfSpeech.OTHER,
          definition: row.definition || row.translationZh || row.text,
          examples: row.examples,
          synonyms: row.synonyms,
          antonyms: row.antonyms,
          translationEn: row.translationEn,
          translationFr: row.translationFr,
          translationZh: row.translationZh || row.definition || "",
          gender: row.gender ? (row.gender as FrenchGender) : null,
          note: row.note || "",
          tags: row.tags,
        },
        update: {
          text: row.text.trim(),
          pos: row.pos ? (row.pos as PartOfSpeech) : undefined,
          definition: row.definition || undefined,
          examples: row.examples.length ? row.examples : undefined,
          synonyms: row.synonyms.length ? row.synonyms : undefined,
          antonyms: row.antonyms.length ? row.antonyms : undefined,
          translationEn: row.translationEn,
          translationFr: row.translationFr,
          translationZh: row.translationZh || undefined,
          gender: row.gender ? (row.gender as FrenchGender) : undefined,
          note: row.note || undefined,
          tags: row.tags.length ? row.tags : undefined,
        },
      });
      upserted += 1;
    }

    return NextResponse.json({ upserted, totalParsed: rows.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Import failed";
    return NextResponse.json({ error: "server_error", reason: message }, { status: 500 });
  }
}
