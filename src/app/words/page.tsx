"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { SpeakButton } from "@/components/SpeakButton";
import { formatPos, POS_OPTIONS } from "@/lib/pos";

type WordRow = {
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
  gender: string | null;
  note: string;
  tags: string[];
  isFailed: boolean;
  dueAt: string;
  createdAt: string;
  failCount: number;
};

export default function WordsPage() {
  const [words, setWords] = useState<WordRow[]>([]);
  const [q, setQ] = useState("");
  const [language, setLanguage] = useState("");
  const [pos, setPos] = useState("");
  const [failedOnly, setFailedOnly] = useState(false);
  const [tag, setTag] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [draftNote, setDraftNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (language) params.set("language", language);
    if (pos) params.set("pos", pos);
    if (failedOnly) params.set("failedOnly", "1");
    if (tag) params.set("tag", tag);
    if (createdFrom) params.set("createdFrom", createdFrom);
    if (createdTo) params.set("createdTo", createdTo);
    const res = await fetch(`/api/words?${params}`);
    const data = await res.json();
    setWords(data.words ?? []);
    setLoading(false);
  }, [q, language, pos, failedOnly, tag, createdFrom, createdTo]);

  useEffect(() => {
    void load();
  }, [load]);

  async function remove(id: string) {
    if (!confirm("Delete this word?")) return;
    await fetch(`/api/words/${id}`, { method: "DELETE" });
    void load();
  }

  function startEditNote(w: WordRow) {
    setEditingNoteId(w.id);
    setDraftNote(w.note ?? "");
  }

  async function saveNote(id: string) {
    setSavingNote(true);
    try {
      const res = await fetch(`/api/words/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: draftNote }),
      });
      if (res.ok) {
        const data = await res.json();
        setWords((prev) => prev.map((w) => (w.id === id ? { ...w, note: data.word.note } : w)));
        setEditingNoteId(null);
      }
    } finally {
      setSavingNote(false);
    }
  }

  return (
    <div className="animate-rise space-y-6">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-ink">
          Word list
        </h1>
        <p className="mt-1 text-ink-soft">Browse, search, and filter your lexicon.</p>
      </header>

      <div className="grid gap-3 border border-line bg-paper/70 p-4 sm:grid-cols-2 lg:grid-cols-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search…"
          className="border border-line bg-paper px-3 py-2 outline-none ring-ink/20 focus:ring-2"
        />
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="border border-line bg-paper px-3 py-2 outline-none"
        >
          <option value="">All languages</option>
          <option value="EN">English</option>
          <option value="FR">French</option>
        </select>
        <select
          value={pos}
          onChange={(e) => setPos(e.target.value)}
          className="border border-line bg-paper px-3 py-2 outline-none"
        >
          <option value="">All word types</option>
          {POS_OPTIONS.filter((o) => o.value).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <input
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          placeholder="Tag"
          className="border border-line bg-paper px-3 py-2 outline-none"
        />
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={failedOnly}
            onChange={(e) => setFailedOnly(e.target.checked)}
          />
          Failed only
        </label>
        <input
          type="date"
          value={createdFrom}
          onChange={(e) => setCreatedFrom(e.target.value)}
          className="border border-line bg-paper px-3 py-2 outline-none"
        />
        <input
          type="date"
          value={createdTo}
          onChange={(e) => setCreatedTo(e.target.value)}
          className="border border-line bg-paper px-3 py-2 outline-none"
        />
      </div>

      {loading ? (
        <p className="text-ink-soft">Loading…</p>
      ) : words.length === 0 ? (
        <p className="text-ink-soft">
          No words yet. <Link href="/">Add your first word</Link>.
        </p>
      ) : (
        <ul className="divide-y divide-line border border-line bg-paper/80">
          {words.map((w) => (
            <li
              key={w.id}
              className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-[family-name:var(--font-display)] text-xl font-semibold text-ink">
                    {w.text}
                    <span className="ml-2 text-sm font-medium text-ink-soft">
                      {formatPos(w.pos)}
                      {" · "}
                      {w.language}
                      {w.gender && w.gender !== "N" ? ` · ${w.gender}` : ""}
                      {w.isFailed ? " · failed" : ""}
                    </span>
                  </p>
                  <SpeakButton text={w.text} language={w.language} />
                </div>
                <p className="text-sm text-ink-soft">{w.definition}</p>
                <p className="mt-1 text-sm">
                  {w.language === "EN" ? w.translationFr : w.translationEn}
                  {" · "}
                  {w.translationZh}
                </p>
                {w.examples?.length > 0 && (
                  <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm text-ink-soft">
                    {w.examples.map((ex) => (
                      <li key={ex}>{ex}</li>
                    ))}
                  </ul>
                )}
                <div className="mt-2 flex flex-col gap-1 text-sm">
                  <p>
                    <span className="font-semibold text-ink-soft">Synonyms: </span>
                    {w.synonyms?.length ? w.synonyms.join(", ") : "—"}
                  </p>
                  <p>
                    <span className="font-semibold text-ink-soft">Antonyms: </span>
                    {w.antonyms?.length ? w.antonyms.join(", ") : "—"}
                  </p>
                </div>
                {w.tags.length > 0 && (
                  <p className="mt-1 text-xs text-ink-soft">{w.tags.join(" · ")}</p>
                )}
                <div className="mt-3 border-t border-line/70 pt-2">
                  <p className="text-xs font-semibold tracking-wide text-ink-soft uppercase">
                    Memory note
                  </p>
                  {editingNoteId === w.id ? (
                    <div className="mt-1 space-y-2">
                      <textarea
                        value={draftNote}
                        onChange={(e) => setDraftNote(e.target.value)}
                        rows={2}
                        className="w-full border border-line bg-paper px-2 py-1.5 text-sm outline-none ring-ink/20 focus:ring-2"
                        placeholder="Mnemonic or tip…"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={savingNote}
                          onClick={() => void saveNote(w.id)}
                          className="bg-ink px-3 py-1 text-xs font-semibold text-paper hover:bg-ink-soft disabled:opacity-50"
                        >
                          {savingNote ? "Saving…" : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingNoteId(null)}
                          className="px-3 py-1 text-xs text-ink-soft hover:text-ink"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEditNote(w)}
                      className="mt-1 block w-full text-left text-sm text-ink-soft hover:text-ink"
                    >
                      {w.note?.trim() ? w.note : "Add a note…"}
                    </button>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => void remove(w.id)}
                className="shrink-0 self-start text-sm text-bad underline-offset-2 hover:underline"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
