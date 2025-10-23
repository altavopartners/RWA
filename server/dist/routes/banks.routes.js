"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../utils/prisma");
const r = (0, express_1.Router)();
r.get("/", async (_req, res) => {
    const rows = await prisma_1.prisma.bank.findMany({ orderBy: { name: "asc" } });
    res.json(rows);
});
exports.default = r;
//# sourceMappingURL=banks.routes.js.map