import { z } from "zod";

const EnrichmentSchema = z.object({
  valid: z.boolean(),
  language: z.enum(["EN", "FR"]).nullish(),
  pos: z
    .enum([
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
    ])
    .nullish(),
  reason: z.string().nullish(),
  definition: z.string().nullish(),
  examples: z.array(z.string()).nullish(),
  synonyms: z.array(z.string()).nullish(),
  antonyms: z.array(z.string()).nullish(),
  translationEn: z.string().nullish(),
  translationFr: z.string().nullish(),
  translationZh: z.string().nullish(),
  gender: z.enum(["M", "F", "N"]).nullish(),
});

export type EnrichmentResult = z.infer<typeof EnrichmentSchema>;

function getLlmConfig() {
  const baseUrl = process.env.LLM_BASE_URL ?? "http://127.0.0.1:11434/v1";
  const apiKey = process.env.LLM_API_KEY ?? "ollama";
  const model = process.env.LLM_MODEL ?? "llama3.2";
  return { baseUrl, apiKey, model };
}

function llmUnreachableMessage(baseUrl: string, cause: unknown): string {
  const detail = cause instanceof Error ? cause.message : String(cause);
  return (
    `Cannot reach LLM at ${baseUrl}. ` +
    `Start Ollama (ollama serve) or set LLM_BASE_URL / LLM_API_KEY / LLM_MODEL in .env. ` +
    `Detail: ${detail}`
  );
}

async function chatJson(system: string, user: string): Promise<unknown> {
  const { baseUrl, apiKey, model } = getLlmConfig();
  const url = `${baseUrl.replace(/\/$/, "")}/chat/completions`;
  const payload = {
    model,
    temperature: 0.2,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  };

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        ...payload,
        // Some local models ignore/reject this; retry without it below if needed.
        response_format: { type: "json_object" },
      }),
    });
  } catch (err) {
    throw new Error(llmUnreachableMessage(baseUrl, err));
  }

  if (!res.ok && res.status === 400) {
    try {
      res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      throw new Error(llmUnreachableMessage(baseUrl, err));
    }
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `LLM request failed (${res.status}) via ${baseUrl} model=${model}: ${body.slice(0, 400)}`,
    );
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("LLM returned empty content");

  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("LLM did not return JSON");
    return JSON.parse(match[0]);
  }
}

const SYSTEM = `You are a bilingual FR/EN lexicographer. Reply with ONLY valid JSON (no markdown).
Rules:
- Detect if the input is English or French (words OR multi-word phrases).
- If the spelling exists in BOTH languages with the same form, set language to "EN".
- If the input is a typo, gibberish, or unknown, set valid=false and explain in reason.
- If valid=true you MUST fill ALL of these:
  - language: "EN" or "FR"
  - pos: part of speech — one of N, V, ADJ, ADV, PREP, CONJ, PRON, DET, INTERJ, PHRASE, OTHER
    (N=noun, V=verb, ADJ=adjective, ADV=adverb; multi-word expressions usually PHRASE)
  - definition: concise definition in the SOURCE language (non-empty)
  - examples: 2-3 short example sentences in the SOURCE language
  - synonyms: at least 2 related words/phrases in the SOURCE language (REQUIRED, never [])
  - antonyms: at least 1 opposite word/phrase in the SOURCE language when one exists; otherwise closest contrasts (REQUIRED, never [] unless truly impossible)
  - translationZh: Chinese Simplified (REQUIRED, never null/empty)
  - If language is "EN": translationFr MUST be a non-empty French string; translationEn must be null
  - If language is "FR": translationEn MUST be a non-empty English string; translationFr must be null
  - gender: for French nouns "M" or "F"; for verbs/adjectives/English use "N" or null
Example for French verb "débrouiller":
{"valid":true,"language":"FR","pos":"V","reason":null,"definition":"Se sortir d'une situation difficile; arranger.","examples":["Il sait se débrouiller seul.","On va débrouiller ce problème."],"synonyms":["se sortir","arranger","se tirer d'affaire"],"antonyms":["échouer","s'emmêler"],"translationEn":"to manage / to sort out","translationFr":null,"translationZh":"设法应付；解决","gender":"N"}
JSON shape:
{
  "valid": boolean,
  "language": "EN"|"FR"|null,
  "pos": "N"|"V"|"ADJ"|"ADV"|"PREP"|"CONJ"|"PRON"|"DET"|"INTERJ"|"PHRASE"|"OTHER",
  "reason": string|null,
  "definition": string,
  "examples": string[],
  "synonyms": string[],
  "antonyms": string[],
  "translationEn": string|null,
  "translationFr": string|null,
  "translationZh": string,
  "gender": "M"|"F"|"N"|null
}`;

function nonEmpty(value: string | null | undefined): string | null {
  const t = value?.trim();
  return t ? t : null;
}

function normalizeEnrichment(raw: EnrichmentResult): EnrichmentResult {
  return {
    ...raw,
    pos: raw.pos ?? "OTHER",
    definition: nonEmpty(raw.definition) ?? undefined,
    translationEn: nonEmpty(raw.translationEn),
    translationFr: nonEmpty(raw.translationFr),
    translationZh: nonEmpty(raw.translationZh) ?? undefined,
    examples: raw.examples?.filter((s) => s.trim()) ?? [],
    synonyms: raw.synonyms?.filter((s) => s.trim()) ?? [],
    antonyms: raw.antonyms?.filter((s) => s.trim()) ?? [],
  };
}

function missingFields(e: EnrichmentResult): string[] {
  if (!e.valid || !e.language) return [];
  const missing: string[] = [];
  if (!e.definition) missing.push("definition");
  if (!e.translationZh) missing.push("translationZh");
  if (e.language === "EN" && !e.translationFr) missing.push("translationFr");
  if (e.language === "FR" && !e.translationEn) missing.push("translationEn");
  if (!e.examples?.length) missing.push("examples");
  if (!e.synonyms?.length) missing.push("synonyms");
  if (!e.antonyms?.length) missing.push("antonyms");
  if (!e.pos) missing.push("pos");
  return missing;
}

function applyLanguageFallback(
  text: string,
  result: EnrichmentResult,
  languageOverride?: "EN" | "FR",
): EnrichmentResult {
  if (!languageOverride || !result.valid || !result.language) {
    return result;
  }

  if (languageOverride === "FR" && result.language === "FR" && !result.translationEn) {
    return { ...result, translationEn: text.trim() || result.translationEn || null };
  }

  if (languageOverride === "EN" && result.language === "EN" && !result.translationFr) {
    return { ...result, translationFr: text.trim() || result.translationFr || null };
  }

  return result;
}

export async function enrichEntry(
  text: string,
  languageOverride?: "EN" | "FR",
  posOverride?: EnrichmentResult["pos"],
): Promise<EnrichmentResult> {
  const userParts = [`Input: """${text}"""`];
  if (languageOverride) {
    userParts.push(
      `Forced language: ${languageOverride}. Still reject if invalid/typo.`,
    );
  }
  if (posOverride) {
    userParts.push(`Forced part of speech (pos): ${posOverride}.`);
  }
  const user = userParts.join("\n");

  let result = normalizeEnrichment(EnrichmentSchema.parse(await chatJson(SYSTEM, user)));
  if (posOverride) result = { ...result, pos: posOverride };
  result = applyLanguageFallback(text, result, languageOverride);

  let missing = missingFields(result);

  if (result.valid && result.language && missing.length > 0) {
    const repairUser =
      `Previous JSON for """${text}""" was incomplete (missing: ${missing.join(", ")}).\n` +
      `Return a FULL corrected JSON object. language=${result.language}. ` +
      `pos must be one of N,V,ADJ,ADV,PREP,CONJ,PRON,DET,INTERJ,PHRASE,OTHER. ` +
      `synonyms must have at least 2 items in the source language. ` +
      `antonyms must have at least 1 item in the source language. ` +
      `If FR, translationEn must be a real English gloss. ` +
      `If EN, translationFr must be a real French gloss. translationZh is required.\n` +
      `Previous JSON: ${JSON.stringify(result)}`;
    result = normalizeEnrichment(EnrichmentSchema.parse(await chatJson(SYSTEM, repairUser)));
    if (posOverride) result = { ...result, pos: posOverride };
    missing = missingFields(result);
  }

  // Soft-fail antonyms after retry (some words have weak opposites); still require synonyms.
  const hardMissing = missing.filter((f) => f !== "antonyms");
  if (result.valid && result.language && hardMissing.length > 0) {
    throw new Error(
      `LLM enrichment incomplete after retry (missing: ${hardMissing.join(", ")})`,
    );
  }

  return result;
}
