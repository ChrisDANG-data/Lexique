"use client";

import { FormEvent, Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Invalid username or password");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="animate-rise mx-auto max-w-md space-y-6">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-ink">
          Sign in
        </h1>
        <p className="mt-1 text-ink-soft">Lex Dual is private — sign in to continue.</p>
      </header>

      <form onSubmit={onSubmit} className="space-y-4 border-t border-line pt-6">
        <label className="block">
          <span className="text-sm font-semibold text-ink">Username</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
            className="mt-1.5 w-full border border-line bg-paper/80 px-3 py-2.5 outline-none ring-ink/20 focus:ring-2"
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-ink">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            className="mt-1.5 w-full border border-line bg-paper/80 px-3 py-2.5 outline-none ring-ink/20 focus:ring-2"
          />
        </label>
        {error && (
          <p className="text-sm text-bad" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="bg-ink px-5 py-2.5 text-sm font-semibold text-paper hover:bg-ink-soft disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-ink-soft">Loading…</p>}>
      <LoginForm />
    </Suspense>
  );
}
