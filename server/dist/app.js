"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cors_2 = require("./config/cors");
const uploads_1 = require("./config/uploads");
const routes_1 = __importDefault(require("./routes"));
const errorHandler_1 = __importDefault(require("./middleware/errorHandler"));
const app = (0, express_1.default)();
// JSON parsing (allow large payloads)
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
// CORS
app.use((0, cors_1.default)(cors_2.corsOptions));
app.options("*", (0, cors_1.default)(cors_2.corsOptions));
// Ensure upload directories exist
(0, uploads_1.ensureUploadDirs)();
// Serve uploaded files (dev)
app.use("/uploads", express_1.default.static(uploads_1.rootUpload));
// Healthcheck
app.get("/", (_req, res) => res.send("Hex-Port backend is running"));
// API routes
app.use("/api", routes_1.default);
// Central error handler
app.use(errorHandler_1.default);
exports.default = app;
//# sourceMappingURL=app.js.map