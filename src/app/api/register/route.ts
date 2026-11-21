import { NextRequest, NextResponse } from "next/server";
import { RegisterSchema, registerUser } from "@/lib/user-auth";

export async function POST(req: NextRequest) {
  const parsed = RegisterSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "invalid_input",
        reason: parsed.error.issues[0]?.message ?? "Invalid input",
      },
      { status: 400 },
    );
  }

  try {
    const result = await registerUser(parsed.data);
    if (!result.ok) {
      return NextResponse.json(
        { error: "username_taken", reason: "That username is already taken" },
        { status: 409 },
      );
    }
    return NextResponse.json({ user: result.user }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Registration failed";
    return NextResponse.json({ error: "server_error", reason: message }, { status: 500 });
  }
}
