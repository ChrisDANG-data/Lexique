"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => void signOut({ callbackUrl: "/login" })}
      className="rounded-md px-3 py-1.5 text-sm font-medium text-ink-soft transition hover:bg-paper-deep hover:text-ink"
    >
      Sign out
    </button>
  );
}
