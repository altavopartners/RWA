"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.productUpload = exports.upload = exports.docTypes = exports.imgTypes = void 0;
const multer_1 = __importDefault(require("multer"));
// import path from 'path'; // inutile ici, à supprimer si non utilisé
const uploads_1 = require("./uploads");
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'images')
            return cb(null, uploads_1.imgDir);
        if (file.fieldname === 'documents')
            return cb(null, uploads_1.docDir);
        cb(null, uploads_1.rootUpload);
    },
    filename: (_req, file, cb) => {
        const safe = (file.originalname || 'file').replace(/\s+/g, '_');
        cb(null, `${Date.now()}_${Math.round(Math.random() * 1e9)}_${safe}`);
    },
});
exports.imgTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
exports.docTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ...exports.imgTypes,
];
function fileFilter(req, file, cb) {
    if (file.fieldname === 'images' && !exports.imgTypes.includes(file.mimetype)) {
        return cb(new Error("Only image files allowed in 'images'"));
    }
    if (file.fieldname === 'documents' && !exports.docTypes.includes(file.mimetype)) {
        return cb(new Error("Unsupported file type for 'documents'"));
    }
    cb(null, true);
}
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: { fileSize: 25 * 1024 * 1024, files: 20 },
});
// ready-to-use field config for product endpoints
exports.productUpload = exports.upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'documents', maxCount: 10 },
]);
//# sourceMappingURL=multer.js.map