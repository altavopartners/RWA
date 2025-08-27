import express, { Request, Response } from 'express';
import cors from 'cors';

import { corsOptions } from './config/cors';
import { ensureUploadDirs, rootUpload } from './config/uploads';
import routes from './routes';
import errorHandler from './middleware/errorHandler';

const app = express();

// JSON parsing
app.use(express.json());

// CORS
app.use(cors(corsOptions));
// preflight (utile pour les requêtes complexes)
app.options('*', cors(corsOptions));

// s'assurer que les dossiers d'upload existent
ensureUploadDirs();

// servir les fichiers uploadés (dev)
app.use('/uploads', express.static(rootUpload));

// healthcheck
app.get('/', (_req: Request, res: Response) => res.send('Hex-Port backend is running'));

// routes API
app.use('/api', routes);

// gestionnaire d'erreurs central
app.use(errorHandler);

export default app;
