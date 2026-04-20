/** Mark seeded rows for idempotent re-runs */
export const SEED_ORDER_NOTE_PREFIX = '[seed] order #';

export function buildSeedOrderNote(index: number): string {
  return `${SEED_ORDER_NOTE_PREFIX}${String(index).padStart(3, '0')}`;
}
