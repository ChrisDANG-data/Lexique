import Link from "next/link";
import { SignOutButton } from "@/components/SignOutButton";

const nav = [
  { href: "/", label: "Add" },
  { href: "/words", label: "Words" },
  { href: "/study", label: "Study" },
  { href: "/import-export", label: "Import / Export" },
];

const linkClass =
  "rounded-md px-3 py-1.5 text-sm font-medium text-ink-soft transition hover:bg-paper-deep hover:text-ink";

export function AppHeader({ userName }: { userName: string | null }) {
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

        {userName ? (
          <div className="flex flex-wrap items-center gap-1">
            <nav className="flex flex-wrap items-center gap-1">
              {nav.map((item) => (
                <Link key={item.href} href={item.href} className={linkClass}>
                  {item.label}
                </Link>
              ))}
            </nav>
            <span className="ml-2 text-sm text-ink-soft" title="Signed in as">
              {userName}
            </span>
            <span className="ml-2">
              <SignOutButton />
            </span>
          </div>
        ) : (
          <nav className="flex items-center gap-1">
            <Link href="/login" className={linkClass}>
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-md border border-line bg-paper px-3 py-1.5 text-sm font-semibold text-ink transition hover:bg-paper-deep"
            >
              Register
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
