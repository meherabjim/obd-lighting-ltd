import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { config } from '../config.js';
import { ApiError } from '../lib/helpers.js';

fs.mkdirSync(config.uploadDir, { recursive: true });

/**
 * The extension comes from the type we accept, never from the name the
 * browser sent. Otherwise "photo.jpg.html" with an image content-type would
 * land in a folder the web server hands straight to visitors.
 */
const ALLOWED = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/avif', '.avif'],
]);

/** The first bytes each format must start with. */
const MAGIC = {
  '.jpg': (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  '.png': (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  '.webp': (b) => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP',
  '.avif': (b) => b.subarray(4, 8).toString('latin1') === 'ftyp',
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, config.uploadDir),
  filename: (req, file, cb) => {
    const ext = ALLOWED.get(file.mimetype) || '.jpg';
    cb(null, `p-${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}${ext}`);
  },
});

export const uploadProductImage = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024, files: 1, fields: 60 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED.has(file.mimetype)) return cb(null, true);
    cb(new ApiError(400, 'Photos must be JPG, PNG, WebP or AVIF.'));
  },
});

/**
 * Run after the upload: a content-type header is just a claim, so check the
 * file on disk really is the picture it says it is, and delete it if not.
 */
export function verifyUpload(req, res, next) {
  if (!req.file) return next();
  const ext = path.extname(req.file.filename).toLowerCase();
  const check = MAGIC[ext];
  try {
    const fd = fs.openSync(req.file.path, 'r');
    const head = Buffer.alloc(12);
    fs.readSync(fd, head, 0, 12, 0);
    fs.closeSync(fd);
    if (check && !check(head)) {
      fs.promises.unlink(req.file.path).catch(() => {});
      req.file = undefined;
      return next(new ApiError(400, 'That file is not a real image.'));
    }
  } catch {
    return next(new ApiError(400, 'The photo could not be read.'));
  }
  next();
}

/** Delete an old photo when it is replaced or its product is removed. */
export function removeUpload(filename) {
  if (!filename) return;
  const target = path.join(config.uploadDir, path.basename(filename));
  fs.promises.unlink(target).catch(() => {});   // already gone is fine
}
