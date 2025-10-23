"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../utils/prisma");
const banks = [
    { code: "AL BARAKA", name: "AL BARAKA BANK TUNISIA", logo: "https://s3.eu-west-3.amazonaws.com/konnect.network.public/media/logos/banks/32.png" },
    { code: "ALUBAF", name: "ALUBAF INTERNATIONAL BANK", logo: "https://s3.eu-west-3.amazonaws.com/s3.konnect.network/bank/1658529901589" },
    // ... colle tout ton JSON ici
];
async function main() {
    for (const b of banks) {
        await prisma_1.prisma.bank.upsert({
            where: { code: b.code },
            update: { name: b.name, logo: b.logo },
            create: { code: b.code, name: b.name, logo: b.logo }
        });
    }
    console.log("Banks seeded ✔");
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
//# sourceMappingURL=seedBanks.js.map