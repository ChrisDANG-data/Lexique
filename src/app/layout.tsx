import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const body = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Lex Dual — FR / EN Vocabulary",
  description: "Learn French and English vocabulary with spaced repetition",
};

const nav = [
  { href: "/", label: "Add" },
  { href: "/words", label: "Words" },
  { href: "/study", label: "Study" },
  { href: "/import-export", label: "Import / Export" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full`}>
      <body className="min-h-full antialiased">
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
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
          {children}
        </main>
      </body>
    </html>
  );
}
