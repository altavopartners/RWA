import { Router } from 'express';
import { getMyCart, addItemToCart } from '../controllers/cart.controller';
import { verifyJWT } from "../middleware/auth";

const router = Router();

router.get('/getmycart', verifyJWT, getMyCart);

router.post("/additemtocart", verifyJWT, addItemToCart); //{ idofproduct: string | number, qty: number }
export default router;
