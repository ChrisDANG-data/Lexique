"use client";

import { useCallback, useEffect, useState } from "react";
import { SpeakButton } from "@/components/SpeakButton";

type GenderCard = {
  id: string;
  text: string;
  gender: "M" | "F";
  translationEn: string | null;
  translationZh: string;
};

type Answer = "M" | "F";

const cardClass =
  "animate-card border border-line bg-paper/95 p-6 shadow-[0_12px_40px_-24px_rgba(11,61,74,0.45)]";

/** Words starting with a vowel elide the article: le/la → l'. */
function startsWithVowel(text: string) {
  return /^[aeiouyàâäéèêëîïôöùûüœæ]/i.test(text.trim());
}

function definiteArticle(card: GenderCard) {
  if (startsWithVowel(card.text)) return `l’${card.text}`;
  return `${card.gender === "M" ? "le" : "la"} ${card.text}`;
}

function indefiniteArticle(card: GenderCard) {
  return `${card.gender === "M" ? "un" : "une"} ${card.text}`;
}

export function GenderDrill({ tag, q }: { tag: string; q: string }) {
  const [cards, setCards] = useState<GenderCard[]>([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<Answer | null>(null);
  const [stats, setStats] = useState({ pass: 0, fail: 0 });
  const [missed, setMissed] = useState<GenderCard[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCards = useCallback(async (): Promise<GenderCard[]> => {
    const params = new URLSearchParams();
    if (tag) params.set("tag", tag);
    if (q) params.set("q", q);
    const res = await fetch(`/api/study/gender?${params}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.cards ?? [];
  }, [tag, q]);

  const start = useCallback((next: GenderCard[]) => {
    setCards(next);
    setIndex(0);
    setPicked(null);
    setStats({ pass: 0, fail: 0 });
    setMissed([]);
    setLoading(false);
  }, []);

  const load = () => void fetchCards().then(start);

  useEffect(() => {
    let cancelled = false;
    void fetchCards().then((next) => {
      if (!cancelled) start(next);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchCards, start]);

  const card = cards[index];
  const done = !loading && cards.length > 0 && index >= cards.length;

  const choose = useCallback(
    (answer: Answer) => {
      if (!card || picked) return;
      setPicked(answer);
      const correct = answer === card.gender;
      setStats((s) => ({ pass: s.pass + (correct ? 1 : 0), fail: s.fail + (correct ? 0 : 1) }));
      if (!correct) setMissed((m) => [...m, card]);
    },
    [card, picked],
  );

  const next = useCallback(() => {
    setPicked(null);
    setIndex((i) => i + 1);
  }, []);

  // Keyboard: 1 / ← = le, 2 / → = la, Enter / Space = next
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      if (!picked) {
        if (e.key === "1" || e.key === "ArrowLeft") choose("M");
        if (e.key === "2" || e.key === "ArrowRight") choose("F");
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        next();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [picked, choose, next]);

  if (loading) return <p className="text-ink-soft">Preparing gender drill…</p>;

  if (cards.length === 0) {
    return (
      <p className="text-ink-soft">
        No French nouns with a gender match the current filters. Add some French nouns first.
      </p>
    );
  }

  if (done) {
    return (
      <div className={`${cardClass} space-y-4`}>
        <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold">
          Drill complete
        </h2>
        <p className="text-lg text-ink-soft">
          Correct {stats.pass} · Wrong {stats.fail} · Total {cards.length}
        </p>
        {missed.length > 0 && (
          <div className="border-t border-line pt-3">
            <p className="text-sm font-semibold text-ink-soft">Review these:</p>
            <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-ink">
              {missed.map((m) => (
                <li key={m.id}>
                  {indefiniteArticle(m)}
                </li>
              ))}
            </ul>
          </div>
        )}
        <button
          type="button"
          onClick={load}
          className="bg-ink px-5 py-2.5 text-sm font-semibold text-paper hover:bg-ink-soft"
        >
          New drill
        </button>
      </div>
    );
  }

  const correct = picked === card.gender;
  const elided = startsWithVowel(card.text);

  return (
    <div className={cardClass}>
      <div className="flex items-center justify-between text-xs font-semibold tracking-[0.2em] text-ink-soft uppercase">
        <span>
          Card {index + 1} of {cards.length} · le or la?
        </span>
        <span className="tracking-normal normal-case">
          ✓ {stats.pass} · ✗ {stats.fail}
        </span>
      </div>

      <p className="mt-4 text-center font-[family-name:var(--font-display)] text-4xl font-semibold text-ink">
        <span className="text-ink-soft/60">___ </span>
        {card.text}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {(["M", "F"] as const).map((g) => {
          const label = g === "M" ? "le" : "la";
          const isAnswer = picked && g === card.gender;
          const isWrongPick = picked === g && !correct;
          return (
            <button
              key={g}
              type="button"
              disabled={!!picked}
              onClick={() => choose(g)}
              className={`border py-4 text-2xl font-semibold transition ${
                isAnswer
                  ? "border-ok bg-ok text-paper"
                  : isWrongPick
                    ? "border-bad bg-bad text-paper"
                    : "border-line bg-paper text-ink hover:bg-paper-deep disabled:opacity-50"
              }`}
            >
              {label}
              <span className="ml-2 text-xs font-normal opacity-70">
                {g === "M" ? "masc. · 1" : "fém. · 2"}
              </span>
            </button>
          );
        })}
      </div>

      {picked && (
        <div className="mt-6 space-y-3">
          <p className={`text-lg font-semibold ${correct ? "text-ok" : "text-bad"}`}>
            {correct ? "Correct" : `Not quite — it’s ${card.gender === "M" ? "masculine" : "feminine"}`}
          </p>
          <p className="font-[family-name:var(--font-display)] text-3xl font-semibold text-ink">
            {definiteArticle(card)}
            <span className="ml-3 text-xl text-ink-soft">· {indefiniteArticle(card)}</span>
          </p>
          {elided && (
            <p className="text-sm text-ink-soft">
              Before a vowel, le/la becomes l’ — learn it with {card.gender === "M" ? "un" : "une"} to
              remember the gender.
            </p>
          )}
          <SpeakButton text={indefiniteArticle(card)} language="FR" label="Listen" />
          <dl className="space-y-1 text-sm text-ink-soft">
            {card.translationEn && (
              <div>
                <span className="font-semibold">EN: </span>
                {card.translationEn}
              </div>
            )}
            <div>
              <span className="font-semibold">ZH: </span>
              {card.translationZh}
            </div>
          </dl>
          <button
            type="button"
            onClick={next}
            autoFocus
            className="bg-ink px-5 py-2.5 text-sm font-semibold text-paper hover:bg-ink-soft"
          >
            {index + 1 >= cards.length ? "Finish" : "Next"}
          </button>
        </div>
      )}
    </div>
  );
}
