import { Client, AccountId, PrivateKey } from "@hashgraph/sdk";

export function getHederaClient() {
  const network = process.env.HEDERA_NETWORK || "testnet";
  const accountId = process.env.HEDERA_ACCOUNT_ID;
  const privateKey = process.env.HEDERA_PRIVATE_KEY;

  if (!accountId || !privateKey) {
    throw new Error("Missing HEDERA_ACCOUNT_ID or HEDERA_PRIVATE_KEY");
  }

  const client =
    network === "mainnet" ? Client.forMainnet() :
    network === "previewnet" ? Client.forPreviewnet() :
    Client.forTestnet();

  client.setOperator(AccountId.fromString(accountId), PrivateKey.fromString(privateKey));
  return client;
}
