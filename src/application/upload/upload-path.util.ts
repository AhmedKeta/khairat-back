/**
 * Path pattern for files stored under ./uploads/images|videos/ (public route /uploads/...).
 */
const STORED_UPLOAD_PATH = /^\/uploads\/(images|videos)\/[^/]+$/;

/**
 * Persist path-only refs for our uploads (e.g. `/uploads/images/uuid.jpg`).
 * Full URLs pointing at those paths are normalized to the pathname; other URLs are unchanged.
 */
export function toStoredUploadRef(input: string): string {
  const t = typeof input === 'string' ? input.trim() : '';
  if (!t) return t;
  if (t.startsWith('/')) {
    const p = t.split('?')[0].split('#')[0];
    return STORED_UPLOAD_PATH.test(p) ? p : t;
  }
  try {
    const u = new URL(t);
    const p = u.pathname;
    if (STORED_UPLOAD_PATH.test(p)) return p;
  } catch {
    /* not an absolute URL */
  }
  return t;
}
