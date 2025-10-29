"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadDocumentMiddleware = void 0;
exports.uploadDocumentController = uploadDocumentController;
exports.getDocumentsByOrderIdController = getDocumentsByOrderIdController;
exports.downloadDocumentController = downloadDocumentController;
const multer_1 = __importDefault(require("multer"));
const document_service_1 = require("../services/document.service");
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});
exports.uploadDocumentMiddleware = upload.single("file");
/** POST /api/documents/upload */
async function uploadDocumentController(req, res) {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: "Unauthorized" });
        if (!req.file)
            return res.status(400).json({ success: false, message: "file required" });
        const { originalname, buffer, mimetype } = req.file;
        const result = await (0, document_service_1.saveDocumentForUser)(req.user.id, originalname, buffer, mimetype, req.body.categoryKey, req.body.typeKey, req.body.orderId);
        return res.json({ success: true, data: result });
    }
    catch (err) {
        return res
            .status(400)
            .json({ success: false, message: err?.message ?? "Upload failed" });
    }
}
/** GET /api/documents?orderId=xxx */
async function getDocumentsByOrderIdController(req, res) {
    try {
        const { orderId } = req.query;
        if (!orderId || typeof orderId !== "string") {
            return res
                .status(400)
                .json({ success: false, message: "orderId required" });
        }
        const { prisma } = await Promise.resolve().then(() => __importStar(require("../utils/prisma")));
        const documents = await prisma.document.findMany({
            where: { orderId },
            orderBy: { createdAt: "desc" },
        });
        return res.json({ success: true, documents });
    }
    catch (err) {
        return res
            .status(500)
            .json({
            success: false,
            message: err?.message ?? "Failed to fetch documents",
        });
    }
}
/** GET /api/documents/:cid/download */
async function downloadDocumentController(req, res) {
    try {
        const { cid } = req.params;
        if (!cid)
            return res.status(400).json({ success: false, message: "cid required" });
        const bytes = await (0, document_service_1.fetchDocumentBytes)(cid);
        res.setHeader("Content-Disposition", `attachment; filename="${cid}"`);
        return res.send(bytes);
    }
    catch (err) {
        return res
            .status(404)
            .json({ success: false, message: err?.message ?? "Not found" });
    }
}
//# sourceMappingURL=document.controller.js.map