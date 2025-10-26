import path from "node:path";
import dotenv from "dotenv";

// Load .env from the server directory
// Try multiple locations:
// 1. server/.env (when running from server folder with npm start)
// 2. ./.env (when running from project root)
// 3. server/.env (when running from project root with node server/dist/server.js)
let envPath = path.join(process.cwd(), ".env");

// If not found, try server subfolder
if (!require("fs").existsSync(envPath)) {
  envPath = path.join(process.cwd(), "server", ".env");
}

console.log("Loading .env from:", envPath);
const envResult = dotenv.config({ path: envPath });
if (envResult.error) {
  console.warn("⚠️  Could not load .env:", envResult.error.message);
} else {
  console.log("✅ .env loaded successfully");
}

import app from "./app";
const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => {
  console.log(`API listening on :${port}`);
});
