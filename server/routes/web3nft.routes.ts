import { Router } from "express";
import { retryMint } from "../controllers/web3nft.controller";

const router = Router();

// POST /api/web3nft/retry/:productId
router.post("/retry/:productId", retryMint);

export default router;




// import { Router } from "express";
// import { createProductNFT } from "../controllers/web3nft.controller";

// const router = Router();

// router.post("/create-nft", createProductNFT);

// export default router;
