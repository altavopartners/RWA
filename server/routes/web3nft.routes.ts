import { Router } from "express";
import { ProductNftController } from "../controllers/web3nft.controller";

// small async wrapper to surface errors to Express error handler
const wrap =
  (fn: any) =>
  (req: any, res: any, next: any) =>
    Promise.resolve(fn(req, res)).catch(next);

const router = Router();

// Create collection (optionally mint immediately)
router.post("/nfts", wrap(ProductNftController.create));

// Mint more serials for an existing token
router.post("/nfts/:tokenId/mint", wrap(ProductNftController.mint));

// Update token-level fields (name/symbol/memo/auto-renew...)
router.patch("/nfts/:tokenId", wrap(ProductNftController.update));

export default router;
