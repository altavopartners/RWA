"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_path_1 = __importDefault(require("node:path"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load .env from the server directory
// Try multiple locations:
// 1. server/.env (when running from server folder with npm start)
// 2. ./.env (when running from project root)
// 3. server/.env (when running from project root with node server/dist/server.js)
let envPath = node_path_1.default.join(process.cwd(), ".env");
// If not found, try server subfolder
if (!require("fs").existsSync(envPath)) {
    envPath = node_path_1.default.join(process.cwd(), "server", ".env");
}
console.log("Loading .env from:", envPath);
const envResult = dotenv_1.default.config({ path: envPath });
if (envResult.error) {
    console.warn("⚠️  Could not load .env:", envResult.error.message);
}
else {
    console.log("✅ .env loaded successfully");
}
const app_1 = __importDefault(require("./app"));
const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app_1.default.listen(port, () => {
    console.log(`API listening on :${port}`);
});
//# sourceMappingURL=server.js.map