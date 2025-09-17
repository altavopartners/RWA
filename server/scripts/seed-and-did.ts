// scripts/seed-and-did.ts
import { randomBytes } from "crypto";

const nativeImport = (s: string) =>
  (Function("s", "return import(s)"))(s) as Promise<any>;

(async () => {
  try {
    // 1) Génère une seed 32 octets (256 bits) et l'affiche en HEX
    const seed = randomBytes(32);
    const seedHex = seed.toString("hex");

    // 2) Polyfills (au cas où ta version de Node en aurait besoin)
    try {
      const web = await nativeImport("node:stream/web");
      Object.assign(globalThis as any, {
        ReadableStream: (web as any).ReadableStream,
        WritableStream: (web as any).WritableStream,
        TransformStream: (web as any).TransformStream,
      });
    } catch {}
    (globalThis as any).Blob ??= (await nativeImport("buffer")).Blob;
    (globalThis as any).File ??= (await nativeImport("undici")).File;

    // 3) Crée un client avec seed fixe pour obtenir un DID déterministe
    // Typings trop stricts -> on cast en any pour passer 'seed'
    const mod: any = await nativeImport("@storacha/client");
    const client = await mod.create({ seed } as any);

    // 4) Affiche ce qu'il faut conserver
    const did = client.agent.did();
    console.log("STORACHA_SEED_HEX=", seedHex);
    console.log("agent DID          =", did);
    console.log("\n➡️  Utilise ce DID comme 'audience' en générant ton UCAN proof.");

    process.exit(0);
  } catch (err: any) {
    console.error("❌ seed-and-did error:", err?.stack || err);
    process.exit(1);
  }
})();
