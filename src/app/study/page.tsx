"use client";

import { AccentKeyboard } from "@/components/AccentKeyboard";
import { GenderDrill } from "@/components/GenderDrill";
import { SpeakButton } from "@/components/SpeakButton";
import { normalizeAnswer } from "@/lib/normalize";
import { formatPos, POS_OPTIONS } from "@/lib/pos";
import { FormEvent, useEffect, useRef, useState } from "react";

type Mode = "type" | "gender";

/** Expected word with the letters whose accents differ from the user's answer highlighted. */
function AccentDiff({ expected, typed }: { expected: string; typed: string }) {
  const e = Array.from(normalizeAnswer(expected));
  const t = Array.from(normalizeAnswer(typed));
  if (e.length !== t.length) return <span>{normalizeAnswer(expected)}</span>;
  return (
    <span>
      {e.map((ch, i) =>
        ch === t[i] ? (
          <span key={i}>{ch}</span>
        ) : (
          <mark key={i} className="bg-transparent font-bold text-bad underline underline-offset-4">
            {ch}
          </mark>
        ),
      )}
    </span>
  );
}

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
  verdict?: "exact" | "accents" | "wrong";
  userAnswer?: string;
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
  const [mode, setMode] = useState<Mode>("type");
  const answerRef = useRef<HTMLInputElement>(null);
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
  const [qInput, setQInput] = useState("");
  const [qFilter, setQFilter] = useState("");
  const [tagOptions, setTagOptions] = useState<string[]>([]);

  useEffect(() => {
    async function loadTagOptions() {
      try {
        const res = await fetch("/api/words?limit=500");
  
        if (!res.ok) return;
  
        const data: {
          words?: Array<{
            tags?: string[];
          }>;
        } = await res.json();
  
        const tags = Array.from(
          new Set(
            (data.words ?? []).flatMap((word) => word.tags ?? [])
          )
        ).sort((a, b) => a.localeCompare(b));
  
        setTagOptions(tags);
      } catch {
        setTagOptions([]);
      }
    }
  
    void loadTagOptions();
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => setQFilter(qInput.trim()), 350);
    return () => window.clearTimeout(handle);
  }, [qInput]);

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
    if (qFilter) params.set("q", qFilter);

    const res = await fetch(`/api/study/session?${params}`);
    const data = await res.json();
    setCards(data.cards ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void loadSession();
  }, [languageFilter, posFilter, tagFilter, qFilter]);

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
    <div className="grid gap-3 border border-line bg-paper/70 p-4 sm:grid-cols-2">
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
      <select
        value={tagFilter}
        onChange={(e) => setTagFilter(e.target.value)}
        className="border border-line bg-paper px-3 py-2 outline-none ring-ink/20 focus:ring-2"
      >
        <option value="">All tags / categories</option>
        {tagOptions.map((tag) => (
          <option key={tag} value={tag}>
            {tag}
          </option>
        ))}
      </select>
      <input
        value={qInput}
        onChange={(e) => setQInput(e.target.value)}
        placeholder="Search word, definition, translation…"
        className="border border-line bg-paper px-3 py-2 outline-none ring-ink/20 focus:ring-2"
      />
    </div>
  );

  const modeTabs = (
    <div className="flex border border-line" role="tablist">
      {(
        [
          ["type", "Type the word"],
          ["gender", "Gender: le / la"],
        ] as const
      ).map(([value, label]) => (
        <button
          key={value}
          type="button"
          role="tab"
          aria-selected={mode === value}
          onClick={() => setMode(value)}
          className={`flex-1 px-4 py-2 text-sm font-semibold transition ${
            mode === value ? "bg-ink text-paper" : "bg-paper text-ink-soft hover:bg-paper-deep"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );

  if (mode === "gender") {
    return (
      <div className="animate-rise mx-auto max-w-xl space-y-6">
        <header>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-ink">
            Study
          </h1>
          <p className="text-sm text-ink-soft">
            Pick the article for each French noun · keys 1 / 2, Enter for next
          </p>
        </header>
        {modeTabs}
        <div className="grid gap-3 border border-line bg-paper/70 p-4 sm:grid-cols-2">
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="border border-line bg-paper px-3 py-2 outline-none ring-ink/20 focus:ring-2"
          >
            <option value="">All tags / categories</option>
            {tagOptions.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
          <input
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="Search word, definition, translation…"
            className="border border-line bg-paper px-3 py-2 outline-none ring-ink/20 focus:ring-2"
          />
        </div>
        <GenderDrill tag={tagFilter} q={qFilter} />
      </div>
    );
  }

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
        {modeTabs}
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
        {modeTabs}
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
        {modeTabs}
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
            Card {index + 1} of {cards.length} · type the word · accents are checked
          </p>
        </div>
        <p className="text-sm text-ink-soft">
          ✓ {stats.pass} · ✗ {stats.fail}
        </p>
      </header>

      {modeTabs}
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
                ref={answerRef}
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
            {card.language === "FR" && (
              <AccentKeyboard inputRef={answerRef} value={answer} onChange={setAnswer} />
            )}
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
              {grade.verdict === "accents"
                ? "Passed — but check the accents"
                : grade.passed
                  ? "Passed"
                  : "Failed — prioritized next time"}
            </p>
            {grade.verdict === "accents" && grade.userAnswer !== undefined && (
              <div className="border-l-2 border-bad/60 pl-3 text-sm text-ink-soft">
                <p>
                  You typed: <span className="text-ink">{grade.userAnswer}</span>
                </p>
                <p>
                  Correct spelling:{" "}
                  <span className="text-base text-ink">
                    <AccentDiff expected={grade.expectedWord} typed={grade.userAnswer} />
                  </span>
                </p>
              </div>
            )}
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
