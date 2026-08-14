/** Default login for personal use — override with AUTH_USERNAME / AUTH_PASSWORD in production. */
export const DEFAULT_AUTH_USERNAME = "admin";
export const DEFAULT_AUTH_PASSWORD = "lexique";
export const DEFAULT_AUTH_SECRET = "lexique-dev-secret-change-in-production";

export function getAuthUsername(): string {
  return process.env.AUTH_USERNAME?.trim() || DEFAULT_AUTH_USERNAME;
}

export function getAuthPassword(): string {
  return process.env.AUTH_PASSWORD?.trim() || DEFAULT_AUTH_PASSWORD;
}

export function getAuthSecret(): string {
  return process.env.AUTH_SECRET?.trim() || DEFAULT_AUTH_SECRET;
}

export function getEffectiveAuthCredentials() {
  const configuredUsername = getAuthUsername();
  const configuredPassword = getAuthPassword();

  return {
    configuredUsername,
    configuredPassword,
    fallbackUsername: DEFAULT_AUTH_USERNAME,
    fallbackPassword: DEFAULT_AUTH_PASSWORD,
  };
}
