"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = errorHandler;
const multer_1 = __importDefault(require("multer"));
// Middleware d'erreur global
function errorHandler(err, _req, res, _next) {
    console.error('[ERROR]', err); // stack complet côté serveur
    if (err instanceof multer_1.default.MulterError) {
        // erreurs liées à multer (taille de fichier, nombre de fichiers, etc.)
        const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
        return res.status(status).json({ error: err.message });
    }
    const status = err.status || 500;
    return res.status(status).json({ error: err.message || 'Server error' });
}
//# sourceMappingURL=errorHandler.js.map