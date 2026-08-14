"use client";

import { SpeakButton } from "@/components/SpeakButton";
import { formatPos, POS_OPTIONS } from "@/lib/pos";
import { FormEvent, useEffect, useState } from "react";

type Card = {
  id: string;
  definition: string;
  language: "EN" | "FR";
  pos: string;
  gender: string | null;
  note?: string;
};

type Grade = {
  passed: boolean;
  expectedWord: string;
  definition: string;
  pos: string;
  translationEn: string | null;
  translationFr: string | null;
  translationZh: string;
  gender: string | null;
  note?: string;
};

export default function StudyPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [grade, setGrade] = useState<Grade | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({ pass: 0, fail: 0 });
  const [languageFilter, setLanguageFilter] = useState("");
  const [posFilter, setPosFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");

  async function loadSession() {
    setLoading(true);
    setGrade(null);
    setIndex(0);
    setAnswer("");
    setStats({ pass: 0, fail: 0 });

    const params = new URLSearchParams();
    if (languageFilter) params.set("language", languageFilter);
    if (posFilter) params.set("pos", posFilter);
    if (tagFilter) params.set("tag", tagFilter);

    const res = await fetch(`/api/study/session?${params}`);
    const data = await res.json();
    setCards(data.cards ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void loadSession();
  }, [languageFilter, posFilter, tagFilter]);

  const card = cards[index];
  const done = !loading && cards.length > 0 && index >= cards.length;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!card || grade) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/study/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wordId: card.id,
          answer,
        }),
      });
      const data = await res.json();
      if (!res.ok) return;
      setGrade(data);
      setStats((s) => ({
        pass: s.pass + (data.passed ? 1 : 0),
        fail: s.fail + (data.passed ? 0 : 1),
      }));
    } finally {
      setSubmitting(false);
    }
  }

  function next() {
    setGrade(null);
    setAnswer("");
    setIndex((i) => i + 1);
  }

  const filterControls = (
    <div className="grid gap-3 border border-line bg-paper/70 p-4 sm:grid-cols-2 lg:grid-cols-3">
      <select
        value={languageFilter}
        onChange={(e) => setLanguageFilter(e.target.value)}
        className="border border-line bg-paper px-3 py-2 outline-none ring-ink/20 focus:ring-2"
      >
        <option value="">All languages</option>
        <option value="EN">English</option>
        <option value="FR">French</option>
      </select>
      <select
        value={posFilter}
        onChange={(e) => setPosFilter(e.target.value)}
        className="border border-line bg-paper px-3 py-2 outline-none ring-ink/20 focus:ring-2"
      >
        <option value="">All word types</option>
        {POS_OPTIONS.filter((o) => o.value).map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <input
        value={tagFilter}
        onChange={(e) => setTagFilter(e.target.value)}
        placeholder="Tag / category"
        className="border border-line bg-paper px-3 py-2 outline-none ring-ink/20 focus:ring-2"
      />
    </div>
  );

  if (loading) {
    return (
      <div className="animate-rise mx-auto max-w-xl space-y-6">
        <header className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-ink">
              Study
            </h1>
          </div>
        </header>
        {filterControls}
        <p className="text-ink-soft">Preparing session…</p>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="animate-rise mx-auto max-w-xl space-y-6">
        <header className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-ink">
              Study
            </h1>
          </div>
        </header>
        {filterControls}
        <p className="text-ink-soft">No words match the current filters. Add some first or change the selection.</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="animate-rise mx-auto max-w-xl space-y-6">
        <header className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-ink">
              Study
            </h1>
          </div>
        </header>
        {filterControls}
        <div className="animate-card border border-line bg-paper/95 p-6 shadow-[0_12px_40px_-24px_rgba(11,61,74,0.45)] space-y-4">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold">
            Session complete
          </h2>
          <p className="text-lg text-ink-soft">
            Passed {stats.pass} · Failed {stats.fail} · Total {cards.length}
          </p>
          <button
            type="button"
            onClick={() => void loadSession()}
            className="bg-ink px-5 py-2.5 text-sm font-semibold text-paper hover:bg-ink-soft"
          >
            New session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-rise mx-auto max-w-xl space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-ink">
            Study
          </h1>
          <p className="text-sm text-ink-soft">
            Card {index + 1} of {cards.length} · type the word · exact match
          </p>
        </div>
        <p className="text-sm text-ink-soft">
          ✓ {stats.pass} · ✗ {stats.fail}
        </p>
      </header>

      {filterControls}

      <div className="animate-card border border-line bg-paper/95 p-6 shadow-[0_12px_40px_-24px_rgba(11,61,74,0.45)]">
        <p className="text-xs font-semibold tracking-[0.2em] text-ink-soft uppercase">
          {formatPos(card.pos)} · {card.language} definition
        </p>
        <p className="mt-3 font-[family-name:var(--font-display)] text-2xl font-semibold leading-snug text-ink sm:text-3xl">
          {card.definition}
        </p>

        {!grade ? (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-ink">Type the word / phrase</span>
              <input
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                autoFocus
                required
                autoComplete="off"
                spellCheck={false}
                placeholder={card.language === "FR" ? "mot français…" : "English word…"}
                className="mt-1 w-full border border-line bg-paper px-3 py-2.5 text-lg outline-none ring-ink/20 focus:ring-2"
              />
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="bg-ink px-5 py-2.5 text-sm font-semibold text-paper hover:bg-ink-soft disabled:opacity-50"
            >
              {submitting ? "Checking…" : "Check"}
            </button>
          </form>
        ) : (
          <div className="mt-6 space-y-3">
            <p className={`text-lg font-semibold ${grade.passed ? "text-ok" : "text-bad"}`}>
              {grade.passed ? "Passed" : "Failed — prioritized next time"}
            </p>
            <p className="font-[family-name:var(--font-display)] text-3xl font-semibold text-ink">
              {grade.expectedWord}
              <span className="ml-2 text-base font-medium text-ink-soft">
                {formatPos(grade.pos ?? card.pos)}
                {grade.gender && grade.gender !== "N" ? ` · ${grade.gender}` : ""}
              </span>
            </p>
            <SpeakButton
              text={grade.expectedWord}
              language={card.language}
              label="Listen pronunciation"
            />
            <dl className="space-y-1 text-sm text-ink-soft">
              {grade.translationEn && (
                <div>
                  <span className="font-semibold">EN: </span>
                  {grade.translationEn}
                </div>
              )}
              {grade.translationFr && (
                <div>
                  <span className="font-semibold">FR: </span>
                  {grade.translationFr}
                </div>
              )}
              <div>
                <span className="font-semibold">ZH: </span>
                {grade.translationZh}
              </div>
            </dl>
            {(grade.note ?? card.note)?.trim() ? (
              <p className="border-t border-line pt-3 text-sm text-ink">
                <span className="font-semibold text-ink-soft">Note: </span>
                {grade.note ?? card.note}
              </p>
            ) : null}
            <button
              type="button"
              onClick={next}
              className="bg-ink px-5 py-2.5 text-sm font-semibold text-paper hover:bg-ink-soft"
            >
              {index + 1 >= cards.length ? "Finish" : "Next card"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
