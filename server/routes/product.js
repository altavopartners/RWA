const router = require('express').Router();
const { productUpload } = require('../config/multer');
const { postProduct, getProducts, getProductById } = require('../controllers/product');

router.post('/', productUpload, postProduct);
router.get('/', getProducts);
router.get('/:id', getProductById);
module.exports = router;
