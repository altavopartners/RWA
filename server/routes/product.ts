import { Router } from 'express';
import { productUpload } from '../config/multer';
import { postProduct, getProducts, getProductById } from '../controllers/product';

const router = Router();

router.post('/', productUpload, postProduct);
router.get('/', getProducts);
router.get('/:id', getProductById);

export default router;
