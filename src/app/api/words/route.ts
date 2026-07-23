import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { enrichEntry } from "@/lib/llm";
import { normalizeLemma } from "@/lib/normalize";
import { buildWordWhere } from "@/lib/words";
import { FrenchGender, Language, PartOfSpeech } from "@/generated/prisma/client";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const languageParam = sp.get("language");
  const language =
    languageParam === "EN" || languageParam === "FR"
      ? (languageParam as Language)
      : undefined;

  const createdFrom = sp.get("createdFrom");
  const createdTo = sp.get("createdTo");

  const where = buildWordWhere({
    q: sp.get("q") ?? undefined,
    language,
    failedOnly: sp.get("failedOnly") === "1",
    tag: sp.get("tag") ?? undefined,
    createdFrom: createdFrom ? new Date(createdFrom) : undefined,
    createdTo: createdTo ? new Date(createdTo) : undefined,
  });

  const posParam = sp.get("pos");
  if (posParam && Object.values(PartOfSpeech).includes(posParam as PartOfSpeech)) {
    where.pos = posParam as PartOfSpeech;
  }

  const words = await prisma.word.findMany({
    where,
    orderBy: [{ isFailed: "desc" }, { updatedAt: "desc" }],
    take: Math.min(Number(sp.get("limit") ?? 100), 500),
  });

  return NextResponse.json({ words });
}

const PosSchema = z.enum([
  "N",
  "V",
  "ADJ",
  "ADV",
  "PREP",
  "CONJ",
  "PRON",
  "DET",
  "INTERJ",
  "PHRASE",
  "OTHER",
]);

const BodySchema = z.object({
  text: z.string().min(1).max(200),
  languageOverride: z.enum(["EN", "FR"]).optional(),
  posOverride: PosSchema.optional(),
  tags: z.array(z.string()).optional(),
  note: z.string().max(2000).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = BodySchema.parse(await req.json());
    const text = body.text.trim().replace(/\s+/g, " ");
    const enrichment = await enrichEntry(
      text,
      body.languageOverride,
      body.posOverride,
    );

    if (!enrichment.valid || !enrichment.language) {
      return NextResponse.json(
        {
          error: "rejected",
          reason: enrichment.reason ?? "Unknown or invalid word/phrase",
        },
        { status: 422 },
      );
    }

    if (enrichment.language === "EN" && !enrichment.translationFr) {
      return NextResponse.json(
        { error: "enrichment_incomplete", reason: "Missing French translation" },
        { status: 502 },
      );
    }
    if (enrichment.language === "FR" && !enrichment.translationEn) {
      return NextResponse.json(
        { error: "enrichment_incomplete", reason: "Missing English translation" },
        { status: 502 },
      );
    }
    if (!enrichment.translationZh || !enrichment.definition) {
      return NextResponse.json(
        {
          error: "enrichment_incomplete",
          reason: "Missing definition or Chinese translation",
        },
        { status: 502 },
      );
    }

    const language = enrichment.language as Language;
    const lemma = normalizeLemma(text);
    const gender =
      language === Language.FR && enrichment.gender
        ? (enrichment.gender as FrenchGender)
        : null;
    const pos = (enrichment.pos ?? body.posOverride ?? "OTHER") as PartOfSpeech;

    const data = {
      text,
      lemma,
      language,
      pos,
      definition: enrichment.definition,
      examples: enrichment.examples ?? [],
      synonyms: enrichment.synonyms ?? [],
      antonyms: enrichment.antonyms ?? [],
      translationEn: enrichment.translationEn ?? null,
      translationFr: enrichment.translationFr ?? null,
      translationZh: enrichment.translationZh,
      gender,
      note: body.note?.trim() ?? "",
      tags: body.tags ?? [],
    };

    const word = await prisma.word.upsert({
      where: { lemma_language: { lemma, language } },
      create: data,
      update: {
        text: data.text,
        pos: data.pos,
        definition: data.definition,
        examples: data.examples,
        synonyms: data.synonyms,
        antonyms: data.antonyms,
        translationEn: data.translationEn,
        translationFr: data.translationFr,
        translationZh: data.translationZh,
        gender: data.gender,
        ...(body.note !== undefined ? { note: data.note } : {}),
        ...(body.tags ? { tags: body.tags } : {}),
      },
    });

    return NextResponse.json({ word });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to add word";
    return NextResponse.json({ error: "server_error", reason: message }, { status: 500 });
  }
}
