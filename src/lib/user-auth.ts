import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 32;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export const RegisterSchema = z.object({
  username: z
    .string()
    .trim()
    .min(USERNAME_MIN, `Username must be at least ${USERNAME_MIN} characters`)
    .max(USERNAME_MAX, `Username must be at most ${USERNAME_MAX} characters`)
    .regex(
      /^[A-Za-z0-9_.-]+$/,
      "Username may only contain letters, numbers, dot, dash and underscore",
    ),
  displayName: z.string().trim().max(64).optional(),
  password: z
    .string()
    .min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters`)
    .max(PASSWORD_MAX, `Password must be at most ${PASSWORD_MAX} characters`),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

export type RegisterResult =
  | { ok: true; user: { id: string; name: string } }
  | { ok: false; error: "username_taken" };

export async function registerUser(input: RegisterInput): Promise<RegisterResult> {
  const key = normalizeUsername(input.username);
  const existing = await prisma.user.findUnique({ where: { username: key } });
  if (existing) return { ok: false, error: "username_taken" };

  const passwordHash = await bcrypt.hash(input.password, 10);
  try {
    const created = await prisma.user.create({
      data: {
        username: key,
        displayName: input.displayName || input.username.trim(),
        passwordHash,
      },
    });
    return { ok: true, user: { id: created.id, name: created.displayName } };
  } catch (err) {
    // Unique violation from a concurrent registration
    if ((err as { code?: string })?.code === "P2002") {
      return { ok: false, error: "username_taken" };
    }
    throw err;
  }
}

/** Verify credentials for an existing account. Never creates users. */
export async function authenticateUser(
  username: string,
  password: string,
): Promise<{ id: string; name: string } | null> {
  const key = normalizeUsername(username);
  if (!key || !password) return null;

  const user = await prisma.user.findUnique({ where: { username: key } });
  if (!user) return null;

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  return { id: user.id, name: user.displayName };
}
