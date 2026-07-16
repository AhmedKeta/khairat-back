import { BadRequestException, Injectable } from '@nestjs/common';
import { existsSync, unlinkSync } from 'fs';
import { relative, resolve } from 'path';
import { toStoredUploadRef } from './upload-path.util';

const UPLOAD_SEGMENT = /^\/uploads\/(images|videos|audio)\/([^/]+)$/;

@Injectable()
export class UploadService {
  /** Store path-only refs (`/uploads/images|videos|audio/filename`) — clients resolve with their public API origin. */
  filesToStoredPaths(
    files: Express.Multer.File[],
    folder: 'images' | 'videos' | 'audio',
  ): string[] {
    return files.map((f) => `/uploads/${folder}/${f.filename}`);
  }

  /**
   * Deletes a file under ./uploads/images|videos/audio given a stored path or full URL.
   * No-op if the file is already missing. Rejects paths outside uploads.
   */
  deleteByPublicUrl(urlOrPath: string): void {
    const trimmed = urlOrPath.trim();
    let pathname: string;
    if (trimmed.startsWith('/')) {
      pathname = trimmed.split('?')[0].split('#')[0];
    } else {
      try {
        pathname = new URL(trimmed).pathname;
      } catch {
        throw new BadRequestException('Invalid URL');
      }
    }

    const match = pathname.match(UPLOAD_SEGMENT);
    if (!match) {
      throw new BadRequestException('URL does not point to an uploaded file');
    }

    const folder = match[1] as 'images' | 'videos' | 'audio';
    const filename = match[2];
    if (!/^[\w.-]+$/.test(filename)) {
      throw new BadRequestException('Invalid file name');
    }

    const uploadRoot = resolve(process.cwd(), 'uploads');
    const abs = resolve(uploadRoot, folder, filename);
    const rel = relative(uploadRoot, abs);
    if (rel.startsWith('..') || rel.includes('..')) {
      throw new BadRequestException('Invalid path');
    }

    if (!existsSync(abs)) {
      return;
    }

    unlinkSync(abs);
  }

  /**
   * Best-effort delete: ignores empty, external, preset, or invalid refs.
   * Never throws — safe to call from update/delete flows.
   */
  safeDeleteByPublicUrl(url?: string | null): void {
    if (url == null || typeof url !== 'string' || !url.trim()) return;
    try {
      const normalized = toStoredUploadRef(url);
      if (!UPLOAD_SEGMENT.test(normalized)) return;
      this.deleteByPublicUrl(normalized);
    } catch {
      /* file may already be missing or path is not managed */
    }
  }

  safeDeleteMany(urls: (string | null | undefined)[]): void {
    for (const url of urls) {
      this.safeDeleteByPublicUrl(url);
    }
  }

  /**
   * Unlink refs present in `oldUrls` but absent from `newUrls`.
   * Normalizes to path-only so full URLs and path refs compare equally.
   */
  diffAndDelete(
    oldUrls: (string | null | undefined)[] | null | undefined,
    newUrls: (string | null | undefined)[] | null | undefined,
  ): void {
    const toKey = (u: string | null | undefined): string | null => {
      if (u == null || typeof u !== 'string' || !u.trim()) return null;
      const n = toStoredUploadRef(u);
      return UPLOAD_SEGMENT.test(n) ? n : null;
    };

    const newSet = new Set(
      (newUrls ?? []).map(toKey).filter((k): k is string => !!k),
    );

    for (const old of oldUrls ?? []) {
      const key = toKey(old);
      if (key && !newSet.has(key)) {
        this.safeDeleteByPublicUrl(key);
      }
    }
  }
}
