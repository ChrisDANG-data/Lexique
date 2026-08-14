"use client";

import Link from "next/link";

const nav = [
  { href: "/", label: "Add" },
  { href: "/words", label: "Words" },
  { href: "/study", label: "Study" },
  { href: "/import-export", label: "Import / Export" },
];

export function AppHeader() {
  return (
    <header className="border-b border-line/70 bg-paper/70 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Link href="/" className="group shrink-0">
          <p className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-ink transition group-hover:text-ink-soft">
            Lex Dual
          </p>
          <p className="text-xs tracking-[0.18em] text-ink-soft/80 uppercase">
            FR · EN · 中文
          </p>
        </Link>

        <nav className="flex flex-wrap items-center gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-ink-soft transition hover:bg-paper-deep hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
