"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = require("../config/multer");
const product_controller_1 = require("../controllers/product.controller");
const router = (0, express_1.Router)();
router.post('/', multer_1.productUpload, product_controller_1.postProduct);
router.get('/', product_controller_1.getProducts);
router.get('/:id', product_controller_1.getProductById);
exports.default = router;
//# sourceMappingURL=product.routes.js.map