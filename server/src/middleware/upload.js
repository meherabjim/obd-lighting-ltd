import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { config } from '../config.js';
import { ApiError } from '../lib/helpers.js';

fs.mkdirSync(config.uploadDir, { recursive: true });

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, config.uploadDir),
  filename: (req, file, cb) => {
    const ext = (path.extname(file.originalname) || '.jpg').toLowerCase();
    const stamp = Date.now().toString(36);
    const rand = Math.random().toString(36).slice(2, 8);
    cb(null, `p-${stamp}-${rand}${ext}`);
  },
});

export const uploadProductImage = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024 },   // 4 MB — plenty for a product photo
  fileFilter: (req, file, cb) => {
    if (ALLOWED.has(file.mimetype)) return cb(null, true);
    cb(new ApiError(400, 'Photos must be JPG, PNG, WebP or AVIF.'));
  },
});

/** Delete an old photo when it is replaced or its product is removed. */
export function removeUpload(filename) {
  if (!filename) return;
  const target = path.join(config.uploadDir, path.basename(filename));
  fs.promises.unlink(target).catch(() => {});   // already gone is fine
}
