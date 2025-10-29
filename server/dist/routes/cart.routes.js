"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cart_controller_1 = require("../controllers/cart.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/getmycart', auth_1.verifyJWT, cart_controller_1.getMyCart);
router.get('/getmycartcount', auth_1.verifyJWT, cart_controller_1.getMyCartCount);
router.post("/additemtocart", auth_1.verifyJWT, cart_controller_1.addItemToCart);
router.post("/incrementitemquantity", auth_1.verifyJWT, cart_controller_1.incrementItemQuantity);
router.post("/decrementitemquantity", auth_1.verifyJWT, cart_controller_1.decrementItemQuantity);
router.post("/removeitemfromcart", auth_1.verifyJWT, cart_controller_1.removeItemFromCart);
exports.default = router;
//# sourceMappingURL=cart.routes.js.map