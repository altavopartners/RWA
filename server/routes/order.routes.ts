import { Router } from 'express';
import { passOrder, getAllMyOrders, getMyOrderById, deleteMyOrder, updateMyOrderStatus } from '../controllers/order.controller';
import { verifyJWT } from "../middleware/auth";

const router = Router();

router.get('/pass-order', verifyJWT, passOrder);

router.get('/get-all-my-orders', verifyJWT, getAllMyOrders);

router.get('/get-my-order/:id', verifyJWT, getMyOrderById);

router.patch('/update-my-order-status/:id', verifyJWT, updateMyOrderStatus);

router.delete('/delete-my-order/:id', verifyJWT, deleteMyOrder);

export default router;
