import { Language, Prisma, ReviewResult } from "@/generated/prisma/client";

export type WordFilters = {
  q?: string;
  language?: Language;
  failedOnly?: boolean;
  tag?: string;
  createdFrom?: Date;
  createdTo?: Date;
};

export function buildWordWhere(filters: WordFilters): Prisma.WordWhereInput {
  const where: Prisma.WordWhereInput = {};

  if (filters.language) where.language = filters.language;
  if (filters.failedOnly) where.isFailed = true;
  if (filters.tag) where.tags = { has: filters.tag };

  if (filters.createdFrom || filters.createdTo) {
    where.createdAt = {};
    if (filters.createdFrom) where.createdAt.gte = filters.createdFrom;
    if (filters.createdTo) where.createdAt.lte = filters.createdTo;
  }

  if (filters.q?.trim()) {
    const q = filters.q.trim();
    where.OR = [
      { text: { contains: q, mode: "insensitive" } },
      { lemma: { contains: q, mode: "insensitive" } },
      { definition: { contains: q, mode: "insensitive" } },
      { translationZh: { contains: q, mode: "insensitive" } },
      { translationEn: { contains: q, mode: "insensitive" } },
      { translationFr: { contains: q, mode: "insensitive" } },
    ];
  }

  return where;
}

export const SESSION_SIZE = 20;

export type StudyPrompt = {
  id: string;
  /** Hidden answer — not shown until graded */
  expectedWord: string;
  definition: string;
  language: Language;
  pos: string;
  gender: string | null;
  translationEn: string | null;
  translationFr: string | null;
  translationZh: string;
};

export function toStudyPrompt(word: {
  id: string;
  text: string;
  definition: string;
  language: Language;
  pos: string;
  translationEn: string | null;
  translationFr: string | null;
  translationZh: string;
  gender: string | null;
}): StudyPrompt {
  return {
    id: word.id,
    expectedWord: word.text,
    definition: word.definition,
    language: word.language,
    pos: word.pos,
    gender: word.gender,
    translationEn: word.translationEn,
    translationFr: word.translationFr,
    translationZh: word.translationZh,
  };
}

export { ReviewResult };
