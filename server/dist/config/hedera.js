"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHederaClient = getHederaClient;
const sdk_1 = require("@hashgraph/sdk");
function getHederaClient() {
    const network = process.env.HEDERA_NETWORK || "testnet";
    const accountId = process.env.HEDERA_ACCOUNT_ID;
    const privateKey = process.env.HEDERA_PRIVATE_KEY;
    if (!accountId || !privateKey) {
        throw new Error("Missing HEDERA_ACCOUNT_ID or HEDERA_PRIVATE_KEY");
    }
    const client = network === "mainnet" ? sdk_1.Client.forMainnet() :
        network === "previewnet" ? sdk_1.Client.forPreviewnet() :
            sdk_1.Client.forTestnet();
    client.setOperator(sdk_1.AccountId.fromString(accountId), sdk_1.PrivateKey.fromString(privateKey));
    return client;
}
//# sourceMappingURL=hedera.js.map