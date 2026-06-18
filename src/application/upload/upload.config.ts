import { mkdirSync } from 'fs';
import { extname, join } from 'path';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';

const IMAGE_MIME = /^image\/(jpeg|png|gif|webp)$/;
const VIDEO_MIME = /^video\/(mp4|webm|quicktime)$/;
const AUDIO_MIME = /^audio\/(mpeg|mp4|webm|ogg|wav|x-wav)$/;

function ensureDir(sub: string) {
  const dest = join(process.cwd(), 'uploads', sub);
  mkdirSync(dest, { recursive: true });
  return dest;
}

export function createImageUploadOptions() {
  const dest = ensureDir('images');
  return {
    storage: diskStorage({
      destination: (_req, _file, cb) => cb(null, dest),
      filename: (_req, file, cb) => {
        const ext = extname(file.originalname) || '.jpg';
        cb(null, `${uuidv4()}${ext}`);
      },
    }),
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
  const dest = ensureDir('images');
  return {
    storage: diskStorage({
      destination: (_req, _file, cb) => cb(null, dest),
      filename: (_req, file, cb) => {
        const ext = extname(file.originalname) || '.jpg';
        cb(null, `${uuidv4()}${ext}`);
      },
    }),
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
  const dest = ensureDir('videos');
  return {
    storage: diskStorage({
      destination: (_req, _file, cb) => cb(null, dest),
      filename: (_req, file, cb) => {
        const ext = extname(file.originalname) || '.mp4';
        cb(null, `${uuidv4()}${ext}`);
      },
    }),
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
  const dest = ensureDir('audio');
  return {
    storage: diskStorage({
      destination: (_req, _file, cb) => cb(null, dest),
      filename: (_req, file, cb) => {
        const ext = extname(file.originalname) || '.mp3';
        cb(null, `${uuidv4()}${ext}`);
      },
    }),
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
