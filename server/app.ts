import express, { Request, Response } from "express";
import cors from "cors";

import { corsOptions } from "./config/cors";
import { ensureUploadDirs, rootUpload } from "./config/uploads";
import routes from "./routes";
import errorHandler from "./middleware/errorHandler";
import bankAuthRoutes from "./routes/bankAuth.routes";
import bankAccountRoutes from "./routes/bankAccount.routes";
import paymentApprovalRoutes from "./routes/paymentApproval.routes";
import banksRoutes from "./routes/banks.routes"; 
const app = express();

// JSON parsing (allow large payloads)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// CORS
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Ensure upload directories exist
ensureUploadDirs();

// Serve uploaded files (dev)
app.use("/uploads", express.static(rootUpload));

// Healthcheck
app.get("/", (_req: Request, res: Response) =>
  res.send("Hex-Port backend is running")
);

// API routes
app.use("/api", routes);

// Central error handler
app.use(errorHandler);

app.use("/api/bank-auth", bankAuthRoutes);
app.use("/api/bank-accounts", bankAccountRoutes);
app.use("/api/bank-payments", paymentApprovalRoutes);
app.use("/api/banks", banksRoutes); // optionnel
export default app;
