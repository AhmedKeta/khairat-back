import { mkdirSync } from 'fs';
import { join } from 'path';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';

const IMAGE_MIME = /^image\/(jpeg|png|gif|webp)$/;
const VIDEO_MIME = /^video\/(mp4|webm|quicktime)$/;
const AUDIO_MIME = /^audio\/(mpeg|mp4|webm|ogg|wav|x-wav)$/;

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
  'audio/mpeg': '.mp3',
  'audio/mp4': '.m4a',
  'audio/webm': '.webm',
  'audio/ogg': '.ogg',
  'audio/wav': '.wav',
  'audio/x-wav': '.wav',
};

/** Ensures `uploads/<sub>` exists (creates it if missing). Safe to call on every upload. */
export function ensureUploadDir(sub: 'images' | 'videos' | 'audio'): string {
  const dest = join(process.cwd(), 'uploads', sub);
  mkdirSync(dest, { recursive: true });
  return dest;
}

function extensionForMime(mimetype: string, defaultExt: string): string {
  return MIME_TO_EXT[mimetype.toLowerCase()] || defaultExt;
}

function diskStorageFor(sub: 'images' | 'videos' | 'audio', defaultExt: string) {
  return diskStorage({
    destination: (_req, _file, cb) => {
      try {
        cb(null, ensureUploadDir(sub));
      } catch (err) {
        cb(err as Error, '');
      }
    },
    filename: (_req, file, cb) => {
      // Never trust client originalname for extension (stored XSS via .html/.svg).
      const ext = extensionForMime(file.mimetype, defaultExt);
      cb(null, `${uuidv4()}${ext}`);
    },
  });
}

export function createImageUploadOptions() {
  return {
    storage: diskStorageFor('images', '.jpg'),
    limits: { fileSize: 15 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!IMAGE_MIME.test(file.mimetype)) {
        return cb(new Error('Only JPEG, PNG, GIF, or WebP images are allowed'), false);
      }
      cb(null, true);
    },
  };
}

export function createOrderPhotoUploadOptions() {
  return {
    storage: diskStorageFor('images', '.jpg'),
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!IMAGE_MIME.test(file.mimetype)) {
        return cb(new Error('Only JPEG, PNG, GIF, or WebP images are allowed'), false);
      }
      cb(null, true);
    },
  };
}

export function createVideoUploadOptions() {
  return {
    storage: diskStorageFor('videos', '.mp4'),
    limits: { fileSize: 120 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!VIDEO_MIME.test(file.mimetype)) {
        return cb(new Error('Only MP4, WebM, or QuickTime videos are allowed'), false);
      }
      cb(null, true);
    },
  };
}

export function createAudioUploadOptions() {
  return {
    storage: diskStorageFor('audio', '.mp3'),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!AUDIO_MIME.test(file.mimetype)) {
        return cb(
          new Error('Only MP3, M4A, WebM, OGG, or WAV audio files are allowed'),
          false,
        );
      }
      cb(null, true);
    },
  };
}
