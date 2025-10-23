"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.approvePayment = approvePayment;
exports.rejectPayment = rejectPayment;
const prisma_1 = require("../utils/prisma");
async function approvePayment(req, res) {
    const actorId = req.bankUser.id;
    const { paymentReleaseId, comments } = req.body || {};
    const pr = await prisma_1.prisma.paymentRelease.findUnique({ where: { id: paymentReleaseId } });
    if (!pr)
        return res.status(404).json({ message: "Payment release not found" });
    const approval = await prisma_1.prisma.paymentApproval.create({
        data: { paymentReleaseId, actorId, action: "APPROVE", comments }
    });
    // exemple: marquer comme released
    const updated = await prisma_1.prisma.paymentRelease.update({
        where: { id: paymentReleaseId },
        data: { released: true, releasedAt: new Date() }
    });
    res.json({ approval, paymentRelease: updated });
}
async function rejectPayment(req, res) {
    const actorId = req.bankUser.id;
    const { paymentReleaseId, comments } = req.body || {};
    const pr = await prisma_1.prisma.paymentRelease.findUnique({ where: { id: paymentReleaseId } });
    if (!pr)
        return res.status(404).json({ message: "Payment release not found" });
    const approval = await prisma_1.prisma.paymentApproval.create({
        data: { paymentReleaseId, actorId, action: "REJECT", comments }
    });
    res.json({ approval });
}
//# sourceMappingURL=paymentApproval.controller.js.map