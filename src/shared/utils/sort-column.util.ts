import { BadRequestException } from '@nestjs/common';

/**
 * Returns a column name that is known-safe for TypeORM orderBy, or throws.
 * Never interpolate raw client input into ORDER BY.
 */
export function resolveSortColumn(
  sortBy: string | undefined,
  allowed: readonly string[],
  fallback: string,
): string {
  const candidate = (sortBy?.trim() || fallback).replace(/[^a-zA-Z0-9_]/g, '');
  if (!allowed.includes(candidate)) {
    throw new BadRequestException(
      `Invalid sortBy. Allowed: ${allowed.join(', ')}`,
    );
  }
  return candidate;
}
