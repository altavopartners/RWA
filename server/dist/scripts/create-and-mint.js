"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// scripts/parentChildNft.ts
// Run: ts-node scripts/parentChildNft.ts
require("dotenv/config");
const sdk_1 = require("@hashgraph/sdk");
// ---------- ENV ----------
const OPERATOR_ID = process.env.HEDERA_ACCOUNT_ID;
const OPERATOR_KEY = process.env.HEDERA_PRIVATE_KEY;
if (!OPERATOR_ID || !OPERATOR_KEY) {
    throw new Error('Missing HEDERA_ACCOUNT_ID or HEDERA_PRIVATE_KEY in env.');
}
// Optional: if you want to reuse a supply key across runs, set HEDERA_SUPPLY_KEY in env
const SUPPLY_KEY_RAW = process.env.HEDERA_SUPPLY_KEY;
// ---------- CLIENT ----------
function getClient() {
    const client = sdk_1.Client.forTestnet(); // change to forMainnet() when ready
    client.setOperator(OPERATOR_ID, OPERATOR_KEY);
    return client;
}
// ---------- Helpers ----------
function fitUtf8(text, maxBytes) {
    const buf = Buffer.from(text, 'utf8');
    if (buf.length <= maxBytes)
        return text;
    const ell = '…';
    const allow = Math.max(0, maxBytes - Buffer.byteLength(ell, 'utf8'));
    let lo = 0, hi = text.length;
    while (lo < hi) {
        const mid = Math.floor((lo + hi + 1) / 2);
        const slice = text.slice(0, mid);
        if (Buffer.byteLength(slice, 'utf8') <= allow)
            lo = mid;
        else
            hi = mid - 1;
    }
    return text.slice(0, lo) + ell;
}
function toMetadata(obj, maxBytes = 100) {
    const json = JSON.stringify(obj);
    const safe = fitUtf8(json, maxBytes);
    const size = Buffer.byteLength(safe, 'utf8');
    if (size > maxBytes) {
        throw new Error(`Metadata too large (${size} bytes), limit=${maxBytes}`);
    }
    return Buffer.from(safe, 'utf8');
}
function symbolFrom(name) {
    return (name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 5).toUpperCase() || 'NFT');
}
// ---------- Core ops ----------
async function createNftCollection(params) {
    const client = getClient();
    const supplyKey = params.supplyKey ??
        (SUPPLY_KEY_RAW ? sdk_1.PrivateKey.fromString(SUPPLY_KEY_RAW) : sdk_1.PrivateKey.generateED25519());
    const tx = new sdk_1.TokenCreateTransaction()
        .setTokenName(params.name)
        .setTokenSymbol(params.symbol ?? symbolFrom(params.name))
        .setTokenType(sdk_1.TokenType.NonFungibleUnique)
        .setDecimals(0)
        .setInitialSupply(0)
        .setTreasuryAccountId(params.treasuryAccountId)
        .setSupplyType(sdk_1.TokenSupplyType.Finite)
        .setMaxSupply(Math.max(1, params.maxSupply))
        .setSupplyKey(supplyKey.publicKey)
        .setMaxTransactionFee(new sdk_1.Hbar(20))
        .freezeWith(client);
    const signed = await tx.sign(sdk_1.PrivateKey.fromString(OPERATOR_KEY));
    const submit = await signed.execute(client);
    const receipt = await submit.getReceipt(client);
    const tokenId = receipt.tokenId?.toString();
    if (!tokenId)
        throw new Error('Token creation returned no tokenId.');
    return {
        tokenId,
        supplyKeyRaw: supplyKey.toStringRaw(), // store securely!
        supplyKey,
    };
}
async function mintNftSerials(params) {
    const client = getClient();
    const serials = [];
    // chunk by 10
    for (let i = 0; i < params.metadataList.length; i += 10) {
        const chunk = params.metadataList.slice(i, i + 10);
        const mintTx = new sdk_1.TokenMintTransaction()
            .setTokenId(sdk_1.TokenId.fromString(params.tokenId))
            .setMetadata(chunk)
            .setMaxTransactionFee(new sdk_1.Hbar(20))
            .freezeWith(client);
        const signedMint = await mintTx.sign(params.supplyKey);
        const submit = await signedMint.execute(client);
        const receipt = await submit.getReceipt(client);
        for (const s of receipt.serials)
            serials.push(Number(s.toString()));
    }
    return serials;
}
async function burnParentSerial(params) {
    const client = getClient();
    const burnTx = new sdk_1.TokenBurnTransaction()
        .setTokenId(sdk_1.TokenId.fromString(params.tokenId))
        .setSerials(params.serials)
        .setMaxTransactionFee(new sdk_1.Hbar(20))
        .freezeWith(client);
    const signed = await burnTx.sign(params.supplyKey);
    const submit = await signed.execute(client);
    const receipt = await submit.getReceipt(client);
    return receipt.status.toString();
}
// ---------- Demo flow ----------
async function main() {
    const client = getClient();
    console.log('Operator:', OPERATOR_ID);
    // 1) Create PARENT collection
    const parent = await createNftCollection({
        name: 'Parent Product Collection',
        symbol: 'PARNT',
        maxSupply: 100, // total possible serials for the parent
        treasuryAccountId: OPERATOR_ID,
    });
    console.log('Parent tokenId:', parent.tokenId);
    // 2) Mint ONE PARENT NFT (serial) with metadata
    const parentSerialMeta = toMetadata({
        kind: 'parent',
        name: 'Parent Item #1',
        batch: 'B-001',
        countryOfOrigin: 'TN',
        pricePerUnit: 12.5,
        // optional business props
        hsCode: '1234.56',
        note: 'Root asset. Will be split into a child.',
    });
    const parentSerials = await mintNftSerials({
        tokenId: parent.tokenId,
        metadataList: [parentSerialMeta],
        supplyKey: parent.supplyKey,
    });
    if (parentSerials.length !== 1)
        throw new Error('Expected to mint exactly 1 parent serial.');
    const parentSerial = parentSerials[0];
    console.log('Minted parent serial:', parentSerial);
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    await sleep(15000);
    // 3) Create CHILD collection (linked to parent in metadata)
    const child = await createNftCollection({
        name: 'Child Product Collection',
        symbol: 'CHILD',
        maxSupply: 1000, // arbitrary; up to you
        treasuryAccountId: OPERATOR_ID,
    });
    console.log('Child tokenId:', child.tokenId);
    // 4) Mint ONE CHILD NFT referencing the parent
    const childSerialMeta = toMetadata({
        kind: 'child',
        name: 'Child Item #1',
        parentTokenId: parent.tokenId,
        parentSerial: parentSerial,
        description: 'Derived from parent serial, represents a split unit.',
        attrs: {
            // any app-specific traits
            weightKg: 0.5,
            grade: 'A',
        },
    });
    const childSerials = await mintNftSerials({
        tokenId: child.tokenId,
        metadataList: [childSerialMeta],
        supplyKey: child.supplyKey,
    });
    const childSerial = childSerials[0];
    console.log('Minted child serial:', childSerial);
    // 5) Burn the PARENT serial to decrease circulating quantity of the parent
    // (this models "moving" value from parent to child)
    const burnStatus = await burnParentSerial({
        tokenId: parent.tokenId,
        serials: [parentSerial],
        supplyKey: parent.supplyKey,
    });
    console.log('Burn parent serial status:', burnStatus);
    console.log('Done ✅');
    client.close();
}
main().catch((e) => {
    console.error(e);
    process.exit(1);
});
//# sourceMappingURL=create-and-mint.js.map