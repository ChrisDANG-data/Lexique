"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/SignOutButton";

const nav = [
  { href: "/", label: "Add" },
  { href: "/words", label: "Words" },
  { href: "/study", label: "Study" },
  { href: "/import-export", label: "Import / Export" },
];

export function AppHeader() {
  const pathname = usePathname();
  if (pathname === "/login") return null;

  return (
    <header className="border-b border-line/70 bg-paper/70 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="group">
          <p className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-ink transition group-hover:text-ink-soft">
            Lex Dual
          </p>
          <p className="text-xs tracking-[0.18em] text-ink-soft/80 uppercase">
            FR · EN · 中文
          </p>
        </Link>
        <nav className="flex flex-wrap items-center gap-1 sm:gap-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-ink-soft transition hover:bg-paper-deep hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
          <SignOutButton />
        </nav>
      </div>
    </header>
  );
}
