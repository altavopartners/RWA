const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

const corsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true);                 // server-to-server/Postman
    return allowedOrigins.includes(origin)
      ? cb(null, true)
      : cb(new Error('Not allowed by CORS'));
  },
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 600,
};

module.exports = { corsOptions, allowedOrigins };
