import path from "node:path";
import dotenv from "dotenv";
const envPath = path.resolve(__dirname, ".env");
dotenv.config({ path: envPath });
import app from './app';
const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => {
  console.log(`API listening on :${port}`);
});
