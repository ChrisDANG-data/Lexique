export const POS_LABELS: Record<string, string> = {
  N: "n.",
  V: "v.",
  ADJ: "adj.",
  ADV: "adv.",
  PREP: "prep.",
  CONJ: "conj.",
  PRON: "pron.",
  DET: "det.",
  INTERJ: "interj.",
  PHRASE: "phrase",
  OTHER: "other",
};

export const POS_OPTIONS = [
  { value: "", label: "Auto-detect" },
  { value: "N", label: "n. — noun" },
  { value: "V", label: "v. — verb" },
  { value: "ADJ", label: "adj. — adjective" },
  { value: "ADV", label: "adv. — adverb" },
  { value: "PREP", label: "prep. — preposition" },
  { value: "CONJ", label: "conj. — conjunction" },
  { value: "PRON", label: "pron. — pronoun" },
  { value: "DET", label: "det. — determiner" },
  { value: "INTERJ", label: "interj. — interjection" },
  { value: "PHRASE", label: "phrase" },
  { value: "OTHER", label: "other" },
] as const;

export function formatPos(pos: string | null | undefined): string {
  if (!pos) return "";
  return POS_LABELS[pos] ?? pos.toLowerCase();
}
