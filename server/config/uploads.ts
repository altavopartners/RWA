import fs from 'fs';
import path from 'path';

export const rootUpload: string = path.join(__dirname, '..', 'uploads');
export const imgDir: string = path.join(rootUpload, 'images');
export const docDir: string = path.join(rootUpload, 'documents');

export function ensureUploadDirs(): void {
  [rootUpload, imgDir, docDir].forEach((p) => {
    if (!fs.existsSync(p)) {
      fs.mkdirSync(p, { recursive: true });
    }
  });
}
