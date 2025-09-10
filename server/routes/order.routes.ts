import { Router } from 'express';
import { passOrder } from '../controllers/order.controller';
import { verifyJWT } from "../middleware/auth";

const router = Router();

router.get('/pass-order', verifyJWT, passOrder);


export default router;
