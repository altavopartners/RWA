"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProduct = createProduct;
exports.listProducts = listProducts;
exports.findProductById = findProductById;
const client_1 = require("@prisma/client"); // << valeur (pas "type")
const prisma_1 = __importDefault(require("../lib/prisma"));
const uploads_1 = require("../config/uploads");
const web3nft_service_1 = require("./web3nft.service"); // <- the Hedera mint service
function filesToMeta(arr = []) {
    return arr.map((f) => ({
        filename: f.filename,
        originalName: f.originalname,
        size: f.size,
        mime: f.mimetype,
        path: f.destination === uploads_1.imgDir
            ? `/uploads/images/${f.filename}`
            : f.destination === uploads_1.docDir
                ? `/uploads/documents/${f.filename}`
                : `/uploads/${f.filename}`,
    }));
}
async function createProduct(body, files) {
    const images = filesToMeta(files?.images ?? []);
    const documents = filesToMeta(files?.documents ?? []);
    // Champs JSON NULLABLE : utiliser DbNull pour "null"
    const imagesValue = images.length
        ? images
        : client_1.Prisma.DbNull;
    const documentsValue = documents.length
        ? documents
        : client_1.Prisma.DbNull;
    // 1) create first (PENDING)
    const created = await prisma_1.default.product.create({
        data: {
            ...body,
            images: imagesValue,
            documents: documentsValue,
            nftStatus: "PENDING",
        },
    });
    // 2) try to mint NFT using the created data
    try {
        const name = String(created.name);
        const quantity = Math.max(1, Number(created.quantity)); // guard rails
        const countryOfOrigin = String(created.countryOfOrigin);
        const pricePerUnit = Number(created.pricePerUnit);
        const hsCode = created.hsCode ?? undefined;
        const { tokenId, serials } = await (0, web3nft_service_1.createProductNFT)({
            name,
            quantity,
            countryOfOrigin,
            pricePerUnit,
            hsCode,
        });
        // 3) update the same row with on-chain refs
        const updated = await prisma_1.default.product.update({
            where: { id: created.id },
            data: {
                hederaTokenId: tokenId,
                hederaSerials: serials,
                nftStatus: "MINTED",
            },
        });
        return updated;
    }
    catch (e) {
        // keep product; just mark as FAILED
        const failed = await prisma_1.default.product.update({
            where: { id: created.id },
            data: { nftStatus: "FAILED" },
        });
        return failed;
    }
}
async function listProducts(params) {
    const { where, orderBy, skip, take } = params;
    const [total, items] = await prisma_1.default.$transaction([
        prisma_1.default.product.count({ where }),
        prisma_1.default.product.findMany({ where, orderBy, skip, take }),
    ]);
    return { total, items };
}
async function findProductById(idParam) {
    // si ton PK est Int
    if (typeof idParam === 'number' || /^\d+$/.test(String(idParam))) {
        const id = typeof idParam === 'number' ? idParam : Number(idParam);
        return prisma_1.default.product.findUnique({ where: { id } });
    }
    // sinon, pas de PK string -> on ne peut pas faire findUnique
    return null;
}
//# sourceMappingURL=product.service.js.map