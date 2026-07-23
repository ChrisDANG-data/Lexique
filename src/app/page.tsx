"use client";

import { FormEvent, useState } from "react";
import { SpeakButton } from "@/components/SpeakButton";
import { formatPos, POS_OPTIONS } from "@/lib/pos";

type WordPayload = {
  id: string;
  text: string;
  language: "EN" | "FR";
  pos: string;
  definition: string;
  examples: string[];
  synonyms: string[];
  antonyms: string[];
  translationEn: string | null;
  translationFr: string | null;
  translationZh: string;
  gender: "M" | "F" | "N" | null;
  note?: string;
};

export default function HomePage() {
  const [text, setText] = useState("");
  const [languageOverride, setLanguageOverride] = useState<"" | "EN" | "FR">("");
  const [posOverride, setPosOverride] = useState("");
  const [tags, setTags] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [word, setWord] = useState<WordPayload | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setWord(null);
    try {
      const res = await fetch("/api/words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          languageOverride: languageOverride || undefined,
          posOverride: posOverride || undefined,
          note: note.trim() || undefined,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.reason ?? data.error ?? "Could not add word");
        return;
      }
      setWord(data.word);
      setText("");
      setNote("");
    } catch {
      setError("Network error — check that the app and LLM are reachable.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-rise space-y-8">
      <section className="max-w-2xl">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Lex Dual
        </h1>
        <p className="mt-3 text-lg text-ink-soft">
          Add a French or English word or phrase. Same spelling in both languages defaults to
          English.
        </p>
      </section>

      <form
        onSubmit={onSubmit}
        className="max-w-2xl space-y-4 border-t border-line/80 pt-6"
      >
        <label className="block">
          <span className="text-sm font-semibold tracking-wide text-ink">Word or phrase</span>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
            placeholder="e.g. rendez-vous, take off, pain"
            className="mt-1.5 w-full border border-line bg-paper/80 px-3 py-2.5 text-lg outline-none ring-ink/20 focus:ring-2"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-ink">Language override</span>
            <select
              value={languageOverride}
              onChange={(e) => setLanguageOverride(e.target.value as "" | "EN" | "FR")}
              className="mt-1.5 w-full border border-line bg-paper/80 px-3 py-2.5 outline-none ring-ink/20 focus:ring-2"
            >
              <option value="">Auto-detect</option>
              <option value="EN">English</option>
              <option value="FR">French</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-ink">Word type</span>
            <select
              value={posOverride}
              onChange={(e) => setPosOverride(e.target.value)}
              className="mt-1.5 w-full border border-line bg-paper/80 px-3 py-2.5 outline-none ring-ink/20 focus:ring-2"
            >
              {POS_OPTIONS.map((opt) => (
                <option key={opt.value || "auto"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="text-sm font-semibold text-ink">Tags (comma-separated)</span>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="travel, A2"
              className="mt-1.5 w-full border border-line bg-paper/80 px-3 py-2.5 outline-none ring-ink/20 focus:ring-2"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-sm font-semibold text-ink">Memory note (optional)</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Mnemonic, tip, or personal association…"
              className="mt-1.5 w-full border border-line bg-paper/80 px-3 py-2.5 outline-none ring-ink/20 focus:ring-2"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={loading || !text.trim()}
          className="bg-ink px-5 py-2.5 text-sm font-semibold tracking-wide text-paper transition hover:bg-ink-soft disabled:opacity-50"
        >
          {loading ? "Enriching…" : "Add to lexicon"}
        </button>
      </form>

      {error && (
        <p className="max-w-2xl border border-bad/30 bg-bad/5 px-4 py-3 text-bad" role="alert">
          {error}
        </p>
      )}

      {word && (
        <article className="animate-rise max-w-2xl space-y-3 border border-line bg-paper/90 p-5">
          <header className="flex flex-wrap items-center gap-3">
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-ink">
              {word.text}
            </h2>
            <span className="text-sm font-medium text-ink-soft">
              {formatPos(word.pos)}
              {" · "}
              {word.language}
              {word.gender && word.gender !== "N" ? ` · ${word.gender}` : ""}
            </span>
            <SpeakButton text={word.text} language={word.language} />
          </header>
          <p className="text-ink">{word.definition}</p>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            {word.translationFr && (
              <div>
                <dt className="font-semibold text-ink-soft">French</dt>
                <dd>{word.translationFr}</dd>
              </div>
            )}
            {word.translationEn && (
              <div>
                <dt className="font-semibold text-ink-soft">English</dt>
                <dd>{word.translationEn}</dd>
              </div>
            )}
            <div>
              <dt className="font-semibold text-ink-soft">Chinese</dt>
              <dd>{word.translationZh}</dd>
            </div>
          </dl>
          {word.examples.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-ink-soft">Examples</h3>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                {word.examples.map((ex) => (
                  <li key={ex}>{ex}</li>
                ))}
              </ul>
            </div>
          )}
          {(word.synonyms.length > 0 || word.antonyms.length > 0) && (
            <div className="flex flex-wrap gap-6 text-sm">
              {word.synonyms.length > 0 && (
                <p>
                  <span className="font-semibold text-ink-soft">Synonyms: </span>
                  {word.synonyms.join(", ")}
                </p>
              )}
              {word.antonyms.length > 0 && (
                <p>
                  <span className="font-semibold text-ink-soft">Antonyms: </span>
                  {word.antonyms.join(", ")}
                </p>
              )}
            </div>
          )}
          {word.note ? (
            <p className="border-t border-line pt-3 text-sm">
              <span className="font-semibold text-ink-soft">Note: </span>
              {word.note}
            </p>
          ) : null}
        </article>
      )}
    </div>
  );
}
