"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.docDir = exports.imgDir = exports.rootUpload = void 0;
exports.ensureUploadDirs = ensureUploadDirs;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
exports.rootUpload = path_1.default.join(__dirname, '..', 'uploads');
exports.imgDir = path_1.default.join(exports.rootUpload, 'images');
exports.docDir = path_1.default.join(exports.rootUpload, 'documents');
function ensureUploadDirs() {
    [exports.rootUpload, exports.imgDir, exports.docDir].forEach((p) => {
        if (!fs_1.default.existsSync(p)) {
            fs_1.default.mkdirSync(p, { recursive: true });
        }
    });
}
//# sourceMappingURL=uploads.js.map