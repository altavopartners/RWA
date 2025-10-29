"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateClientKycController = exports.getClientsController = void 0;
const clientService = __importStar(require("../services/bank.service"));
/**
 * GET /api/clients
 */
const getClientsController = async (_req, res) => {
    try {
        const clients = await clientService.getClients();
        // Map data to a cleaner response for frontend
        const response = clients.map((c) => ({
            id: c.id,
            name: c.fullName || c.businessName,
            email: c.email,
            hederaId: c.accountId,
            type: c.userType === "PRODUCER" ? "Producer" : "Buyer",
            kycStatus: c.kycStatus.charAt(0) + c.kycStatus.slice(1).toLowerCase(), // e.g., "Pending"
            kycExpiry: c.kycExpiry,
            orderCount: c.orders.length,
            totalVolume: c.orders.reduce((sum, o) => sum + Number(o.total), 0),
            lastActivity: c.updatedAt,
        }));
        res.status(200).json(response);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch clients" });
    }
};
exports.getClientsController = getClientsController;
/**
 * POST /api/clients/:id/kyc
 */
const updateClientKycController = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, reason, reviewedBy } = req.body;
        const updatedClient = await clientService.updateClientKyc(id, {
            action,
            reason,
            reviewedBy,
        });
        res.status(200).json({
            id: updatedClient.id,
            kycStatus: updatedClient.kycStatus,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update KYC" });
    }
};
exports.updateClientKycController = updateClientKycController;
//# sourceMappingURL=client.controller.js.map