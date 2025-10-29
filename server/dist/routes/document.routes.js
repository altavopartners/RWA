"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/document.routes.ts
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const document_controller_1 = require("../controllers/document.controller");
const router = (0, express_1.Router)();
router.post("/upload", auth_1.verifyJWT, document_controller_1.uploadDocumentMiddleware, document_controller_1.uploadDocumentController);
router.get("/", auth_1.verifyJWT, document_controller_1.getDocumentsByOrderIdController);
router.get("/:cid/download", document_controller_1.downloadDocumentController);
exports.default = router;
//# sourceMappingURL=document.routes.js.map