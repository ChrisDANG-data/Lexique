import type { Word } from "@/generated/prisma/client";

const CSV_HEADERS = [
  "text",
  "language",
  "pos",
  "definition",
  "examples",
  "synonyms",
  "antonyms",
  "translationEn",
  "translationFr",
  "translationZh",
  "gender",
  "note",
  "tags",
] as const;

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function joinList(values: string[]): string {
  return values.join(" | ");
}

export function wordsToCsv(words: Word[]): string {
  const lines = [CSV_HEADERS.join(",")];
  for (const w of words) {
    const row = [
      w.text,
      w.language,
      w.pos,
      w.definition,
      joinList(w.examples),
      joinList(w.synonyms),
      joinList(w.antonyms),
      w.translationEn ?? "",
      w.translationFr ?? "",
      w.translationZh,
      w.gender ?? "",
      w.note ?? "",
      joinList(w.tags),
    ].map(escapeCsv);
    lines.push(row.join(","));
  }
  return lines.join("\n");
}

/** Anki-importable TSV: Front / Back / Tags */
export function wordsToAnkiTsv(words: Word[]): string {
  const lines: string[] = [];
  for (const w of words) {
    const front = w.language === "EN" ? w.text : `${w.text}${w.gender && w.gender !== "N" ? ` (${w.gender})` : ""}`;
    const primary = w.language === "EN" ? w.translationFr : w.translationEn;
    const back = [primary, w.translationZh, w.definition].filter(Boolean).join("<br>");
    const tags = ["vocab", w.language.toLowerCase(), w.pos.toLowerCase(), ...w.tags].join(" ");
    lines.push([front, back, tags].join("\t"));
  }
  return lines.join("\n");
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

export type ImportedWordRow = {
  text: string;
  language: "EN" | "FR";
  pos: string | null;
  definition: string;
  examples: string[];
  synonyms: string[];
  antonyms: string[];
  translationEn: string | null;
  translationFr: string | null;
  translationZh: string;
  gender: "M" | "F" | "N" | null;
  note: string;
  tags: string[];
};

const POS_VALUES = new Set([
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

function parsePos(raw: string | undefined): string | null {
  const v = raw?.trim().toUpperCase() || "";
  return POS_VALUES.has(v) ? v : null;
}

function splitList(value: string): string[] {
  if (!value.trim()) return [];
  return value.split("|").map((s) => s.trim()).filter(Boolean);
}

export function parseCsvImport(content: string): ImportedWordRow[] {
  const lines = content.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((h) => h.trim());
  const idx = (name: string) => headers.indexOf(name);

  const rows: ImportedWordRow[] = [];
  for (const line of lines.slice(1)) {
    const cols = parseCsvLine(line);
    const text = cols[idx("text")]?.trim();
    const language = cols[idx("language")]?.trim().toUpperCase();
    if (!text || (language !== "EN" && language !== "FR")) continue;

    const genderRaw = cols[idx("gender")]?.trim().toUpperCase() || "";
    const gender =
      genderRaw === "M" || genderRaw === "F" || genderRaw === "N" ? genderRaw : null;

    rows.push({
      text,
      language,
      pos: parsePos(cols[idx("pos")]),
      definition: cols[idx("definition")]?.trim() || "",
      examples: splitList(cols[idx("examples")] ?? ""),
      synonyms: splitList(cols[idx("synonyms")] ?? ""),
      antonyms: splitList(cols[idx("antonyms")] ?? ""),
      translationEn: cols[idx("translationEn")]?.trim() || null,
      translationFr: cols[idx("translationFr")]?.trim() || null,
      translationZh: cols[idx("translationZh")]?.trim() || "",
      gender,
      note: cols[idx("note")]?.trim() || "",
      tags: splitList(cols[idx("tags")] ?? ""),
    });
  }
  return rows;
}

/** Parse Anki TSV: front, back, optional tags. Language inferred from tags or default EN. */
export function parseAnkiTsv(content: string): ImportedWordRow[] {
  const lines = content.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim());
  const rows: ImportedWordRow[] = [];

  for (const line of lines) {
    if (line.startsWith("#")) continue;
    const [front, back = "", tagsCol = ""] = line.split("\t");
    const text = front.replace(/\s*\([MFN]\)\s*$/i, "").trim();
    if (!text) continue;

    const tags = tagsCol.split(/\s+/).filter(Boolean);
    const language: "EN" | "FR" = tags.includes("fr") ? "FR" : "EN";
    const parts = back.split(/<br\s*\/?>/i).map((p) => p.trim()).filter(Boolean);
    const primary = parts[0] ?? "";
    const zh = parts[1] ?? "";
    const definition = parts[2] ?? (parts.slice(1).join(" ") || primary);

    const genderMatch = front.match(/\(([MFN])\)/i);
    const gender = genderMatch
      ? (genderMatch[1].toUpperCase() as "M" | "F" | "N")
      : null;

    rows.push({
      text,
      language,
      pos: null,
      definition,
      examples: [],
      synonyms: [],
      antonyms: [],
      translationEn: language === "FR" ? primary : null,
      translationFr: language === "EN" ? primary : null,
      translationZh: zh,
      gender: language === "FR" ? gender : null,
      note: "",
      tags: tags.filter((t) => t !== "vocab" && t !== "en" && t !== "fr"),
    });
  }
  return rows;
}
