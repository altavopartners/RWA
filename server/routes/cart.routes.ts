import { Router } from 'express';
import { getMyCart, addItemToCart, getMyCartCount, removeItemFromCart,
  incrementItemQuantity,
  decrementItemQuantity, } from '../controllers/cart.controller';
import { verifyJWT } from "../middleware/auth";

const router = Router();

router.get('/getmycart', verifyJWT, getMyCart);


router.get('/getmycartcount', verifyJWT, getMyCartCount);

router.post("/additemtocart", verifyJWT, addItemToCart);
router.post("/incrementitemquantity", verifyJWT, incrementItemQuantity);
router.post("/decrementitemquantity", verifyJWT, decrementItemQuantity);
router.post("/removeitemfromcart", verifyJWT, removeItemFromCart);

export default router;
