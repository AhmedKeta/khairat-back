import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, unlinkSync } from 'fs';
import { join, relative, resolve } from 'path';

const UPLOAD_SEGMENT = /^\/uploads\/(images|videos)\/([^/]+)$/;

@Injectable()
export class UploadService {
  constructor(private readonly configService: ConfigService) {}

  filesToPublicUrls(files: Express.Multer.File[], folder: 'images' | 'videos'): string[] {
    const base = this.configService
      .get<string>('API_PUBLIC_URL', 'http://localhost:3001')
      .replace(/\/$/, '');
    return files.map((f) => `${base}/uploads/${folder}/${f.filename}`);
  }

  /**
   * Deletes a file under ./uploads/images|videos/ given a public URL.
   * No-op if the file is already missing. Rejects paths outside uploads.
   */
  deleteByPublicUrl(url: string): void {
    let pathname: string;
    try {
      pathname = new URL(url).pathname;
    } catch {
      throw new BadRequestException('Invalid URL');
    }

    const match = pathname.match(UPLOAD_SEGMENT);
    if (!match) {
      throw new BadRequestException('URL does not point to an uploaded image or video');
    }

    const folder = match[1] as 'images' | 'videos';
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
}
