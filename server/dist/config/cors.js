"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsOptions = exports.allowedOrigins = void 0;
exports.allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
];
exports.corsOptions = {
    origin(origin, cb) {
        if (!origin)
            return cb(null, true); // server-to-server/Postman
        return exports.allowedOrigins.includes(origin)
            ? cb(null, true)
            : cb(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 600,
};
//# sourceMappingURL=cors.js.map