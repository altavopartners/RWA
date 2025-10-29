"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_controller_1 = require("../controllers/client.controller");
const router = (0, express_1.Router)();
router.get("/clients", client_controller_1.getClientsController);
router.post("/clients/:id/kyc", client_controller_1.updateClientKycController);
exports.default = router;
//# sourceMappingURL=client.routes.js.map