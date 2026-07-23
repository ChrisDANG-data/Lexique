import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const word = await prisma.word.findUnique({ where: { id } });
  if (!word) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ word });
}

const PatchSchema = z.object({
  note: z.string().max(2000).optional(),
  tags: z.array(z.string()).optional(),
});

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const body = PatchSchema.parse(await req.json());
    const word = await prisma.word.update({
      where: { id },
      data: {
        ...(body.note !== undefined ? { note: body.note } : {}),
        ...(body.tags !== undefined ? { tags: body.tags } : {}),
      },
    });
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
  const { id } = await ctx.params;
  await prisma.word.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
