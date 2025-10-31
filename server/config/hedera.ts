import { Client, AccountId, PrivateKey } from "@hashgraph/sdk";

export function getHederaClient() {
  const network = process.env.HEDERA_NETWORK || "testnet";
  const accountId = process.env.HEDERA_ACCOUNT_ID;
  const operatorKeyString = process.env.HEDERA_OPERATOR_KEY;

  if (!accountId || !operatorKeyString) {
    throw new Error("Missing HEDERA_ACCOUNT_ID or HEDERA_OPERATOR_KEY");
  }

  const client =
    network === "mainnet"
      ? Client.forMainnet()
      : network === "previewnet"
      ? Client.forPreviewnet()
      : Client.forTestnet();

  // Load the operator key (DER format from Hedera portal)
  const privateKey = PrivateKey.fromStringDer(operatorKeyString);
  client.setOperator(AccountId.fromString(accountId), privateKey);
  return client;
}
