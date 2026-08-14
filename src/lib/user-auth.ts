import bcrypt from "bcryptjs";
import {
  DEFAULT_AUTH_PASSWORD,
  DEFAULT_AUTH_USERNAME,
  getAuthPassword,
  getAuthUsername,
} from "@/lib/auth-defaults";
import { prisma } from "@/lib/db";

const MIN_PASSWORD_LENGTH = 3;

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export async function authenticateOrRegister(
  username: string,
  password: string,
): Promise<{ id: string; name: string } | null> {
  const displayName = username.trim();
  const key = normalizeUsername(username);

  if (!key || password.length < MIN_PASSWORD_LENGTH) {
    return null;
  }

  const configuredUsername = normalizeUsername(getAuthUsername());
  const configuredPassword = getAuthPassword();
  const defaultUsername = normalizeUsername(DEFAULT_AUTH_USERNAME);
  const defaultPassword = DEFAULT_AUTH_PASSWORD;
  const isDefaultAdminLogin =
    (key === configuredUsername || key === defaultUsername) &&
    (password === configuredPassword || password === defaultPassword);

  const existing = await prisma.user.findUnique({ where: { username: key } });

  if (existing) {
    const ok = await bcrypt.compare(password, existing.passwordHash);
    if (!ok && !isDefaultAdminLogin) return null;
    return { id: existing.id, name: existing.displayName };
  }

  if (!isDefaultAdminLogin) {
    const passwordHash = await bcrypt.hash(password, 10);
    const created = await prisma.user.create({
      data: {
        username: key,
        displayName,
        passwordHash,
      },
    });

    return { id: created.id, name: created.displayName };
  }

  const passwordHash = await bcrypt.hash(configuredPassword, 10);
  const created = await prisma.user.create({
    data: {
      username: key,
      displayName: displayName || DEFAULT_AUTH_USERNAME,
      passwordHash,
    },
  });

  return { id: created.id, name: created.displayName };
}
