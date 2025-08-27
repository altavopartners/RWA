import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

// Middleware d'erreur global
export default function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('[ERROR]', err); // stack complet côté serveur

  if (err instanceof multer.MulterError) {
    // erreurs liées à multer (taille de fichier, nombre de fichiers, etc.)
    const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    return res.status(status).json({ error: err.message });
  }

  const status: number = err.status || 500;
  return res.status(status).json({ error: err.message || 'Server error' });
}
