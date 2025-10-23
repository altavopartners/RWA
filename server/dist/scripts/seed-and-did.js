"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// scripts/seed-and-did.ts
const crypto_1 = require("crypto");
const nativeImport = (s) => (Function("s", "return import(s)"))(s);
(async () => {
    var _a, _b;
    try {
        // 1) Génère une seed 32 octets (256 bits) et l'affiche en HEX
        const seed = (0, crypto_1.randomBytes)(32);
        const seedHex = seed.toString("hex");
        // 2) Polyfills (au cas où ta version de Node en aurait besoin)
        try {
            const web = await nativeImport("node:stream/web");
            Object.assign(globalThis, {
                ReadableStream: web.ReadableStream,
                WritableStream: web.WritableStream,
                TransformStream: web.TransformStream,
            });
        }
        catch { }
        (_a = globalThis).Blob ?? (_a.Blob = (await nativeImport("buffer")).Blob);
        (_b = globalThis).File ?? (_b.File = (await nativeImport("undici")).File);
        // 3) Crée un client avec seed fixe pour obtenir un DID déterministe
        // Typings trop stricts -> on cast en any pour passer 'seed'
        const mod = await nativeImport("@storacha/client");
        const client = await mod.create({ seed });
        // 4) Affiche ce qu'il faut conserver
        const did = client.agent.did();
        console.log("STORACHA_SEED_HEX=", seedHex);
        console.log("agent DID          =", did);
        console.log("\n➡️  Utilise ce DID comme 'audience' en générant ton UCAN proof.");
        process.exit(0);
    }
    catch (err) {
        console.error("❌ seed-and-did error:", err?.stack || err);
        process.exit(1);
    }
})();
//# sourceMappingURL=seed-and-did.js.map