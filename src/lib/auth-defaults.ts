const DEV_AUTH_SECRET = "lexique-dev-secret-change-in-production";

/**
 * JWT secret. In production AUTH_SECRET must be set (NextAuth errors without it);
 * in development a fixed fallback keeps `npm run dev` working out of the box.
 */
export function getAuthSecret(): string | undefined {
  const fromEnv = process.env.AUTH_SECRET?.trim();
  if (fromEnv) return fromEnv;
  return process.env.NODE_ENV === "production" ? undefined : DEV_AUTH_SECRET;
}
