"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { AuthField, safeCallbackUrl } from "@/components/AuthField";

const PASSWORD_MIN = 8;

function RegisterForm() {
  const searchParams = useSearchParams();
  const callbackUrl = safeCallbackUrl(searchParams.get("callbackUrl"));
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < PASSWORD_MIN) {
      setError(`Password must be at least ${PASSWORD_MIN} characters`);
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        password,
        displayName: displayName.trim() || undefined,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setLoading(false);
      setError(data?.reason ?? "Registration failed");
      return;
    }

    const login = await signIn("credentials", { username, password, redirect: false });
    if (!login || login.error) {
      // Account was created but auto sign-in failed — send them to the login screen.
      window.location.assign("/login");
      return;
    }
    window.location.assign(callbackUrl);
  }

  return (
    <div className="animate-rise mx-auto max-w-md space-y-6">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-ink">
          Create account
        </h1>
        <p className="mt-1 text-ink-soft">
          Your words, study progress and reviews are kept separate from other users.
        </p>
      </header>

      <form onSubmit={onSubmit} className="space-y-4 border-t border-line pt-6">
        <AuthField
          label="Username"
          value={username}
          onChange={setUsername}
          autoComplete="username"
          hint="3–32 characters: letters, numbers, dot, dash, underscore."
        />
        <AuthField
          label="Display name (optional)"
          value={displayName}
          onChange={setDisplayName}
          autoComplete="nickname"
          required={false}
        />
        <AuthField
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          hint={`At least ${PASSWORD_MIN} characters.`}
        />
        <AuthField
          label="Confirm password"
          type="password"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
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
            {loading ? "Creating account…" : "Create account"}
          </button>
          <p className="text-sm text-ink-soft">
            Already registered?{" "}
            <Link href="/login" className="font-semibold text-ink underline underline-offset-2">
              Sign in
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<p className="text-ink-soft">Loading…</p>}>
      <RegisterForm />
    </Suspense>
  );
}
