"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const web3nft_controller_1 = require("../controllers/web3nft.controller");
const router = (0, express_1.Router)();
// POST /api/web3nft/retry/:productId
router.post("/retry/:productId", web3nft_controller_1.retryMint);
exports.default = router;
// import { Router } from "express";
// import { createProductNFT } from "../controllers/web3nft.controller";
// const router = Router();
// router.post("/create-nft", createProductNFT);
// export default router;
//# sourceMappingURL=web3nft.routes.js.map