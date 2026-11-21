import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getUserId, unauthorized } from "@/lib/session";
import { FrenchGender, PartOfSpeech } from "@/generated/prisma/client";
import { normalizeLemma } from "@/lib/normalize";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const { id } = await ctx.params;
  const word = await prisma.word.findFirst({ where: { id, userId } });
  if (!word) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ word });
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

const PatchSchema = z.object({
  text: z.string().min(1).max(200).optional(),
  pos: PosSchema.optional(),
  definition: z.string().min(1).optional(),
  examples: z.array(z.string()).optional(),
  synonyms: z.array(z.string()).optional(),
  antonyms: z.array(z.string()).optional(),
  translationEn: z.string().nullable().optional(),
  translationFr: z.string().nullable().optional(),
  translationZh: z.string().optional(),
  gender: z.enum(["M", "F", "N"]).nullable().optional(),
  note: z.string().max(2000).optional(),
  tags: z.array(z.string()).optional(),
});

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getUserId();
    if (!userId) return unauthorized();
    const { id } = await ctx.params;
    const owned = await prisma.word.findFirst({ where: { id, userId }, select: { id: true } });
    if (!owned) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const body = PatchSchema.parse(await req.json());

    const data: Record<string, unknown> = {};
    if (body.text !== undefined) {
      data.text = body.text.trim().replace(/\s+/g, " ");
      data.lemma = normalizeLemma(body.text);
    }
    if (body.pos !== undefined) data.pos = body.pos as PartOfSpeech;
    if (body.definition !== undefined) data.definition = body.definition;
    if (body.examples !== undefined) data.examples = body.examples;
    if (body.synonyms !== undefined) data.synonyms = body.synonyms;
    if (body.antonyms !== undefined) data.antonyms = body.antonyms;
    if (body.translationEn !== undefined) data.translationEn = body.translationEn;
    if (body.translationFr !== undefined) data.translationFr = body.translationFr;
    if (body.translationZh !== undefined) data.translationZh = body.translationZh;
    if (body.gender !== undefined) {
      data.gender = body.gender ? (body.gender as FrenchGender) : null;
    }
    if (body.note !== undefined) data.note = body.note;
    if (body.tags !== undefined) data.tags = body.tags;

    const word = await prisma.word.update({ where: { id }, data });
    return NextResponse.json({ word });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    return NextResponse.json({ error: "server_error", reason: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const { id } = await ctx.params;
  const { count } = await prisma.word.deleteMany({ where: { id, userId } });
  if (count === 0) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
