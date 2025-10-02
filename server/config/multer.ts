import type { Request } from 'express';
import multer, { FileFilterCallback } from 'multer';
// import path from 'path'; // inutile ici, à supprimer si non utilisé
import { rootUpload, imgDir, docDir } from './uploads';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'images') return cb(null, imgDir);
    if (file.fieldname === 'documents') return cb(null, docDir);
    cb(null, rootUpload);
  },
  filename: (_req, file, cb) => {
    const safe = (file.originalname || 'file').replace(/\s+/g, '_');
    cb(null, `${Date.now()}_${Math.round(Math.random() * 1e9)}_${safe}`);
  },
});

export const imgTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] as const;

export const docTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ...imgTypes,
] as const;

function fileFilter(req: Request, file: Express.Multer.File, cb: FileFilterCallback) {
  if (file.fieldname === 'images' && !imgTypes.includes(file.mimetype as any)) {
    return cb(new Error("Only image files allowed in 'images'"));
  }
  if (file.fieldname === 'documents' && !docTypes.includes(file.mimetype as any)) {
    return cb(new Error("Unsupported file type for 'documents'"));
  }
  cb(null, true);
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024, files: 20 },
});

// ready-to-use field config for product endpoints
export const productUpload: ReturnType<typeof upload.fields> = upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'documents', maxCount: 10 },
]);
