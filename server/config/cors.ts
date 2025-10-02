import { CorsOptions } from 'cors';

export const allowedOrigins: string[] = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

export const corsOptions: CorsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true); // server-to-server/Postman
    return allowedOrigins.includes(origin)
      ? cb(null, true)
      : cb(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 600,
};
