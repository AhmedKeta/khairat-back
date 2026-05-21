/** Keys never returned in API JSON (case-sensitive). */
const SENSITIVE_KEYS = new Set([
  'password',
  'refreshToken',
  'currentPassword',
  'newPassword',
  'confirmPassword',
]);

/**
 * Recursively removes sensitive fields from objects returned by the API.
 * Safe for arrays, nested relations (e.g. order.user), and paginated `{ data: [] }`.
 */
export function stripSensitiveFields<T>(value: T): T {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => stripSensitiveFields(item)) as T;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value !== 'object') {
    return value;
  }

  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key)) {
      continue;
    }
    out[key] = stripSensitiveFields(val);
  }
  return out as T;
}

/** Omit password (and related secrets) from a user-shaped object. */
export function sanitizeUser<T extends Record<string, unknown>>(user: T): Omit<T, 'password'> {
  return stripSensitiveFields(user) as Omit<T, 'password'>;
}
