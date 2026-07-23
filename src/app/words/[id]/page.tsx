"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SpeakButton } from "@/components/SpeakButton";
import { POS_OPTIONS } from "@/lib/pos";

type WordForm = {
  text: string;
  language: "EN" | "FR";
  pos: string;
  definition: string;
  examplesText: string;
  synonymsText: string;
  antonymsText: string;
  translationEn: string;
  translationFr: string;
  translationZh: string;
  gender: "" | "M" | "F" | "N";
  note: string;
  tagsText: string;
};

function splitPipe(value: string): string[] {
  return value
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function EditWordPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState<WordForm | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [reenriching, setReenriching] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/words/${params.id}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.reason ?? "Word not found");
        return;
      }
      const w = data.word;
      setForm({
        text: w.text,
        language: w.language,
        pos: w.pos,
        definition: w.definition,
        examplesText: (w.examples ?? []).join(" | "),
        synonymsText: (w.synonyms ?? []).join(" | "),
        antonymsText: (w.antonyms ?? []).join(" | "),
        translationEn: w.translationEn ?? "",
        translationFr: w.translationFr ?? "",
        translationZh: w.translationZh ?? "",
        gender: w.gender ?? "",
        note: w.note ?? "",
        tagsText: (w.tags ?? []).join(", "),
      });
    }
    void load();
  }, [params.id]);

  function update<K extends keyof WordForm>(key: K, value: WordForm[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/words/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: form.text,
          pos: form.pos,
          definition: form.definition,
          examples: splitPipe(form.examplesText),
          synonyms: splitPipe(form.synonymsText),
          antonyms: splitPipe(form.antonymsText),
          translationEn: form.translationEn.trim() || null,
          translationFr: form.translationFr.trim() || null,
          translationZh: form.translationZh,
          gender: form.gender || null,
          note: form.note,
          tags: form.tagsText
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.reason ?? "Save failed");
        return;
      }
      router.push("/words");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function onReenrich() {
    if (!confirm("Re-fetch definition and translations from the LLM? Your note and study progress are kept.")) {
      return;
    }
    setReenriching(true);
    setError(null);
    try {
      const res = await fetch(`/api/words/${params.id}/reenrich`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.reason ?? "Re-enrich failed");
        return;
      }
      const w = data.word;
      setForm({
        text: w.text,
        language: w.language,
        pos: w.pos,
        definition: w.definition,
        examplesText: (w.examples ?? []).join(" | "),
        synonymsText: (w.synonyms ?? []).join(" | "),
        antonymsText: (w.antonyms ?? []).join(" | "),
        translationEn: w.translationEn ?? "",
        translationFr: w.translationFr ?? "",
        translationZh: w.translationZh ?? "",
        gender: w.gender ?? "",
        note: w.note ?? "",
        tagsText: (w.tags ?? []).join(", "),
      });
    } finally {
      setReenriching(false);
    }
  }

  if (error && !form) {
    return (
      <p className="text-bad">
        {error} — <Link href="/words">Back</Link>
      </p>
    );
  }

  if (!form) {
    return <p className="text-ink-soft">Loading…</p>;
  }

  return (
    <div className="animate-rise mx-auto max-w-2xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-ink">
            Edit word
          </h1>
          <p className="mt-1 text-ink-soft">
            {form.language} · lists use <code className="text-xs">|</code> between items
          </p>
        </div>
        <div className="flex gap-2">
          <SpeakButton text={form.text} language={form.language} />
          <Link href="/words" className="text-sm text-ink-soft hover:text-ink">
            Back
          </Link>
        </div>
      </header>

      {error && (
        <p className="border border-bad/30 bg-bad/5 px-4 py-3 text-bad" role="alert">
          {error}
        </p>
      )}

      <form onSubmit={onSave} className="space-y-4 border-t border-line pt-6">
        <label className="block">
          <span className="text-sm font-semibold text-ink">Word / phrase</span>
          <input
            value={form.text}
            onChange={(e) => update("text", e.target.value)}
            required
            className="mt-1 w-full border border-line bg-paper px-3 py-2 outline-none ring-ink/20 focus:ring-2"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-ink">Word type</span>
            <select
              value={form.pos}
              onChange={(e) => update("pos", e.target.value)}
              className="mt-1 w-full border border-line bg-paper px-3 py-2"
            >
              {POS_OPTIONS.filter((o) => o.value).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-ink">Gender (FR)</span>
            <select
              value={form.gender}
              onChange={(e) => update("gender", e.target.value as WordForm["gender"])}
              className="mt-1 w-full border border-line bg-paper px-3 py-2"
            >
              <option value="">—</option>
              <option value="M">M</option>
              <option value="F">F</option>
              <option value="N">N</option>
            </select>
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-semibold text-ink">Definition</span>
          <textarea
            value={form.definition}
            onChange={(e) => update("definition", e.target.value)}
            required
            rows={3}
            className="mt-1 w-full border border-line bg-paper px-3 py-2 outline-none ring-ink/20 focus:ring-2"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-ink">English translation</span>
            <input
              value={form.translationEn}
              onChange={(e) => update("translationEn", e.target.value)}
              className="mt-1 w-full border border-line bg-paper px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-ink">French translation</span>
            <input
              value={form.translationFr}
              onChange={(e) => update("translationFr", e.target.value)}
              className="mt-1 w-full border border-line bg-paper px-3 py-2"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-sm font-semibold text-ink">Chinese translation</span>
            <input
              value={form.translationZh}
              onChange={(e) => update("translationZh", e.target.value)}
              required
              className="mt-1 w-full border border-line bg-paper px-3 py-2"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-semibold text-ink">Examples</span>
          <textarea
            value={form.examplesText}
            onChange={(e) => update("examplesText", e.target.value)}
            rows={2}
            className="mt-1 w-full border border-line bg-paper px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-ink">Synonyms</span>
          <input
            value={form.synonymsText}
            onChange={(e) => update("synonymsText", e.target.value)}
            className="mt-1 w-full border border-line bg-paper px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-ink">Antonyms</span>
          <input
            value={form.antonymsText}
            onChange={(e) => update("antonymsText", e.target.value)}
            className="mt-1 w-full border border-line bg-paper px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-ink">Memory note</span>
          <textarea
            value={form.note}
            onChange={(e) => update("note", e.target.value)}
            rows={2}
            className="mt-1 w-full border border-line bg-paper px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-ink">Tags (comma-separated)</span>
          <input
            value={form.tagsText}
            onChange={(e) => update("tagsText", e.target.value)}
            className="mt-1 w-full border border-line bg-paper px-3 py-2"
          />
        </label>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-ink px-5 py-2.5 text-sm font-semibold text-paper hover:bg-ink-soft disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
          <button
            type="button"
            disabled={reenriching}
            onClick={() => void onReenrich()}
            className="border border-line bg-paper px-5 py-2.5 text-sm font-semibold hover:bg-paper-deep disabled:opacity-50"
          >
            {reenriching ? "Re-enriching…" : "Re-enrich with LLM"}
          </button>
        </div>
      </form>
    </div>
  );
}
