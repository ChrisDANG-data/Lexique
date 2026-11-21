import { NextResponse } from "next/server";
import { auth } from "@/auth";

/** Returns the signed-in user's id, or null. */
export async function getUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}
