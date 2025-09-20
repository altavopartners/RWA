import { Router } from "express";
import { createProductNFT } from "../controllers/web3nft.controller";

const router = Router();

router.post("/create-nft", createProductNFT);

export default router;
