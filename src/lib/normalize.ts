/** Normalize word/phrase for dedupe keys. */
export function normalizeLemma(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Normalize for grading: trim, case-insensitive, collapse spaces, and treat
 * typographic variants as identical (’ vs ', « » quotes, œ vs oe, æ vs ae).
 * Accents are kept — see `stripAccents` for the lenient comparison.
 */
export function normalizeAnswer(text: string): string {
  return text
    .normalize("NFC")
    .trim()
    .toLowerCase()
    .replace(/[’‘ʼ`´]/g, "'")
    .replace(/[«»“”]/g, '"')
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .replace(/\s*'\s*/g, "'")
    .replace(/\s+/g, " ");
}

/** Remove diacritics: é → e, ç → c, ï → i … */
export function stripAccents(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").normalize("NFC");
}

/**
 * - `exact`: correct, accents included
 * - `accents`: correct letters, but accents missing or wrong (counts as a pass)
 * - `wrong`: different word
 */
export type AnswerVerdict = "exact" | "accents" | "wrong";

export function gradeAnswer(expected: string, actual: string): AnswerVerdict {
  const e = normalizeAnswer(expected);
  const a = normalizeAnswer(actual);
  if (!a) return "wrong";
  if (e === a) return "exact";
  if (stripAccents(e) === stripAccents(a)) return "accents";
  return "wrong";
}

export function answersMatch(expected: string, actual: string): boolean {
  return gradeAnswer(expected, actual) !== "wrong";
}
