"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { AuthField, safeCallbackUrl } from "@/components/AuthField";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = safeCallbackUrl(searchParams.get("callbackUrl"));
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", { username, password, redirect: false });
    if (!res || res.error) {
      setLoading(false);
      setError("Invalid username or password");
      return;
    }
    // Full navigation so the server-rendered header picks up the new session.
    window.location.assign(callbackUrl);
  }

  const registerHref =
    callbackUrl === "/"
      ? "/register"
      : `/register?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  return (
    <div className="animate-rise mx-auto max-w-md space-y-6">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-ink">
          Sign in
        </h1>
        <p className="mt-1 text-ink-soft">Sign in to your own vocabulary list.</p>
      </header>

      <form onSubmit={onSubmit} className="space-y-4 border-t border-line pt-6">
        <AuthField
          label="Username"
          value={username}
          onChange={setUsername}
          autoComplete="username"
        />
        <AuthField
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />
        {error && (
          <p className="text-sm text-bad" role="alert">
            {error}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-ink px-5 py-2.5 text-sm font-semibold text-paper hover:bg-ink-soft disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
          <p className="text-sm text-ink-soft">
            No account?{" "}
            <Link
              href={registerHref}
              className="font-semibold text-ink underline underline-offset-2"
            >
              Create one
            </Link>
          </p>
        </div>
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
