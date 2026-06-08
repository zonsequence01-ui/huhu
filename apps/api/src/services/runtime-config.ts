const UNSAFE_JWT_SECRETS = new Set([
  "change-me-in-production",
  "huhu-dev-secret-change-in-production",
]);

export function isJwtSecretConfigured(): boolean {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) return false;
  return !UNSAFE_JWT_SECRETS.has(secret);
}

export function assertProductionRuntimeConfig(): void {
  if (process.env.NODE_ENV !== "production") return;
  if (isJwtSecretConfigured()) return;
  throw new Error(
    "JWT_SECRET must be set to a strong value in production (not the docker-compose default)",
  );
}
