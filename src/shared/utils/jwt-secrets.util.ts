const WEAK_OR_PLACEHOLDER_SECRETS = new Set([
  'secret',
  'refresh-secret',
  'your-super-secret-jwt-key-change-in-production',
  'your-super-secret-refresh-key-change-in-production',
  'your-super-secret-reset-key-change-in-production',
  'replace-with-a-unique-random-secret-at-least-32-chars',
  'replace-with-a-unique-random-refresh-secret-32chars',
  'replace-with-a-unique-random-reset-secret-32chars',
]);

export function requireJwtSecret(
  value: string | undefined,
  name: string,
): string {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) {
    throw new Error(
      `${name} is required. Set a strong random value in the environment.`,
    );
  }
  if (WEAK_OR_PLACEHOLDER_SECRETS.has(trimmed) || trimmed.length < 32) {
    throw new Error(
      `${name} is missing, too short (min 32 chars), or still a documented placeholder. Generate a strong random secret.`,
    );
  }
  return trimmed;
}
