import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enrichEntry } from "@/lib/llm";
import { FrenchGender, Language, PartOfSpeech } from "@/generated/prisma/client";

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const existing = await prisma.word.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const enrichment = await enrichEntry(
      existing.text,
      existing.language as "EN" | "FR",
      existing.pos as EnrichmentPos,
    );

    if (!enrichment.valid || !enrichment.language) {
      return NextResponse.json(
        {
          error: "rejected",
          reason: enrichment.reason ?? "Could not re-enrich this word",
        },
        { status: 422 },
      );
    }

    if (
      (enrichment.language === "EN" && !enrichment.translationFr) ||
      (enrichment.language === "FR" && !enrichment.translationEn) ||
      !enrichment.translationZh ||
      !enrichment.definition
    ) {
      return NextResponse.json(
        { error: "enrichment_incomplete", reason: "LLM returned incomplete data" },
        { status: 502 },
      );
    }

    const word = await prisma.word.update({
      where: { id },
      data: {
        language: enrichment.language as Language,
        pos: (enrichment.pos ?? existing.pos) as PartOfSpeech,
        definition: enrichment.definition,
        examples: enrichment.examples ?? [],
        synonyms: enrichment.synonyms ?? [],
        antonyms: enrichment.antonyms ?? [],
        translationEn: enrichment.translationEn ?? null,
        translationFr: enrichment.translationFr ?? null,
        translationZh: enrichment.translationZh,
        gender:
          enrichment.language === "FR" && enrichment.gender
            ? (enrichment.gender as FrenchGender)
            : null,
        // keep note + tags + SRS state
      },
    });

    return NextResponse.json({ word });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Re-enrich failed";
    return NextResponse.json({ error: "server_error", reason: message }, { status: 500 });
  }
}

type EnrichmentPos =
  | "N"
  | "V"
  | "ADJ"
  | "ADV"
  | "PREP"
  | "CONJ"
  | "PRON"
  | "DET"
  | "INTERJ"
  | "PHRASE"
  | "OTHER";
