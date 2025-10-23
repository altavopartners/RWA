"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const product_routes_1 = __importDefault(require("./product.routes"));
const cart_routes_1 = __importDefault(require("./cart.routes"));
const order_routes_1 = __importDefault(require("./order.routes"));
const auth_routes_1 = __importDefault(require("./auth.routes"));
const did_routes_1 = __importDefault(require("./did.routes"));
const document_routes_1 = __importDefault(require("./document.routes"));
const profile_routes_1 = __importDefault(require("./profile.routes"));
const session_routes_1 = __importDefault(require("./session.routes"));
const web3nft_routes_1 = __importDefault(require("./web3nft.routes"));
const bank_routes_1 = __importDefault(require("./bank.routes")); // ← added
const router = (0, express_1.Router)();
// Web3 NFT routes
router.use("/web3nft", web3nft_routes_1.default);
// Product routes
router.use("/products", product_routes_1.default);
// Cart routes
router.use("/carts", cart_routes_1.default);
// Order routes
router.use("/orders", order_routes_1.default);
// Auth routes
router.use("/auth", auth_routes_1.default);
// DID routes
router.use("/did", did_routes_1.default);
// Document routes
router.use("/documents", document_routes_1.default);
// Profile routes
router.use("/profile", profile_routes_1.default);
// Session routes
router.use("/", session_routes_1.default); // session routes are under /auth/refresh, /auth/logout, etc.
// Bank routes
router.use("/bank", bank_routes_1.default); // ← added
exports.default = router;
//# sourceMappingURL=index.js.map