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
exports.saveDocumentForUser = saveDocumentForUser;
exports.fetchDocumentBytes = fetchDocumentBytes;
// src/services/document.service.ts
const prisma_1 = require("../utils/prisma");
const crypto_1 = __importDefault(require("crypto"));
// dynamic import keeps CJS paths happy during ts-node execution
async function getW3() {
    return await Promise.resolve().then(() => __importStar(require("../../server/utils/w3"))); // <- updated path
}
async function saveDocumentForUser(userId, filename, buffer, mimeType, categoryKey, typeKey, orderId) {
    const sha256 = crypto_1.default.createHash("sha256").update(buffer).digest("hex");
    const { w3Upload, gatewayUrl } = await getW3();
    const cid = await w3Upload(buffer, filename, mimeType);
    const url = await gatewayUrl(cid);
    const doc = await prisma_1.prisma.document.create({
        data: { userId, filename, cid, url, category: categoryKey, documentType: typeKey, orderId },
    });
    return { doc, cid, url, sha256 };
}
async function fetchDocumentBytes(cid) {
    const { w3FetchBytes } = await getW3();
    return await w3FetchBytes(cid);
}
//# sourceMappingURL=document.service.js.map