"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => void signOut({ callbackUrl: "/login" })}
      className="rounded-md border border-line bg-paper px-3 py-1.5 text-sm font-semibold text-ink transition hover:bg-paper-deep"
    >
      Sign out
    </button>
  );
}
