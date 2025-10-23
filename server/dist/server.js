"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_path_1 = __importDefault(require("node:path"));
const dotenv_1 = __importDefault(require("dotenv"));
const envPath = node_path_1.default.resolve(__dirname, ".env");
dotenv_1.default.config({ path: envPath });
const app_1 = __importDefault(require("./app"));
const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app_1.default.listen(port, () => {
    console.log(`API listening on :${port}`);
});
//# sourceMappingURL=server.js.map