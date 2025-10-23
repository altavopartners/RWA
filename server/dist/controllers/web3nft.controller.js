"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.retryMint = retryMint;
const client_1 = require("@prisma/client");
const web3nft_service_1 = require("../services/web3nft.service");
const prisma = new client_1.PrismaClient();
async function retryMint(req, res, next) {
    try {
        const id = Number(req.params.productId);
        const product = await prisma.product.findUnique({ where: { id } });
        if (!product)
            return res.status(404).json({ message: "Product not found" });
        if (product.nftStatus === "MINTED" && product.hederaTokenId) {
            return res.json(product);
        }
        const { tokenId, serials } = await (0, web3nft_service_1.createProductNFT)({
            name: product.name,
            quantity: product.quantity,
            countryOfOrigin: product.countryOfOrigin,
            pricePerUnit: product.pricePerUnit,
            hsCode: product.hsCode ?? undefined,
        });
        const updated = await prisma.product.update({
            where: { id: product.id },
            data: { hederaTokenId: tokenId, hederaSerials: serials, nftStatus: "MINTED" },
        });
        res.json(updated);
    }
    catch (err) {
        next(err);
    }
}
// import { Request, Response } from "express";
// import {
//   Client,
//   PrivateKey,
//   AccountId,
//   TokenCreateTransaction,
//   TokenType,
//   TokenSupplyType,
//   TokenMintTransaction
// } from "@hashgraph/sdk";
// const operatorId = AccountId.fromString("0.0.6499040");
// const operatorKey = PrivateKey.fromString("3030020100300706052b8104000a04220420f00b73add472af9375f7f38763b3e9fe35acd6afd1adcbb0806de29911171514");
// const client = Client.forTestnet().setOperator(operatorId, operatorKey);
// export const createProductNFT = async (req: Request, res: Response) => {
//   try {
//     const { product, origin, quantity, priceHBAR, HSCode } = req.body;
// console.log("Creating NFT with data:", req.body);
//     // Create NFT
//     const tokenCreateTx = new TokenCreateTransaction()
//       .setTokenName(`${product} Collection`)
//       .setTokenSymbol(product.substring(0, 4).toUpperCase())
//       .setTokenType(TokenType.NonFungibleUnique)
//       .setDecimals(0)
//       .setInitialSupply(0)
//       .setTreasuryAccountId(operatorId)
//       .setSupplyType(TokenSupplyType.Finite)
//       .setMaxSupply(1000)
//       .setAdminKey(operatorKey)
//       .setSupplyKey(operatorKey)
//       .freezeWith(client);
//     const signedCreateTx = await tokenCreateTx.sign(operatorKey);
//     const createSubmit = await signedCreateTx.execute(client);
//     const createReceipt = await createSubmit.getReceipt(client);
//     const tokenId = createReceipt.tokenId!.toString();
//     // Step 2: Mint NFT with product metadata
//     const metadata = Buffer.from(
//       JSON.stringify({ product })
//     );
//     const mintTx = new TokenMintTransaction()
//       .setTokenId(tokenId)
//       .setMetadata([metadata])
//       .freezeWith(client);
//     const signedMintTx = await mintTx.sign(operatorKey);
//     const mintSubmit = await signedMintTx.execute(client);
//     const mintReceipt = await mintSubmit.getReceipt(client);
//     res.json({
//       success: true,
//       tokenId,
//       serials: mintReceipt.serials.toString(),
//     });
//   } catch (err: any) {
//     console.error("❌ NFT creation failed:", err);
//     res.status(500).json({ success: false, error: err.message });
//   }
// };
//# sourceMappingURL=web3nft.controller.js.map