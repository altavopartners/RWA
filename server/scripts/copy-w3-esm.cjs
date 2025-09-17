const fs = require("fs");
const path = require("path");
const src = path.resolve("server/utils/w3.esm.mjs");
const dest = path.resolve("dist/server/utils/w3.esm.mjs");
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.copyFileSync(src, dest);
console.log("Copied w3.esm.mjs to dist.");
