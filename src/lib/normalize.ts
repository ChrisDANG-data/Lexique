/** Normalize word/phrase for dedupe keys. */
export function normalizeLemma(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Exact-match grading: trim + case-insensitive + collapse spaces. */
export function normalizeAnswer(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

export function answersMatch(expected: string, actual: string): boolean {
  return normalizeAnswer(expected) === normalizeAnswer(actual);
}
