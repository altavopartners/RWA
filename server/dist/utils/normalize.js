"use strict";
// utils/normalize.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.toNumOrNull = toNumOrNull;
exports.trimOrNull = trimOrNull;
exports.trimOrUndefined = trimOrUndefined;
exports.parseBool = parseBool;
exports.toInt = toInt;
exports.buildProductBody = buildProductBody;
function toNumOrNull(v) {
    if (v === undefined || v === null || v === "")
        return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}
function trimOrNull(v) {
    if (typeof v !== "string")
        return null;
    const t = v.trim();
    // Treat empty and literal 'null'/'undefined' strings as null (defensive)
    if (t === "" || t.toLowerCase() === "null" || t.toLowerCase() === "undefined")
        return null;
    return t;
}
function trimOrUndefined(v) {
    return typeof v === "string" ? v.trim() : undefined;
}
function parseBool(v) {
    if (v === undefined)
        return undefined;
    if (typeof v === "boolean")
        return v;
    const s = String(v).toLowerCase().trim();
    if (["1", "true", "yes", "y"].includes(s))
        return true;
    if (["0", "false", "no", "n"].includes(s))
        return false;
    return undefined;
}
function toInt(v, def) {
    if (v === undefined || v === null || v === "")
        return def;
    const n = Number(v);
    return Number.isFinite(n) ? n : def;
}
function buildProductBody(raw) {
    const r = raw;
    const nameMaybe = trimOrNull(r?.name);
    const unitMaybe = trimOrNull(r?.unit);
    const quantity = Number(r?.quantity);
    const pricePerUnit = Number(r?.pricePerUnit);
    const missing = [];
    if (!nameMaybe)
        missing.push("name");
    if (!unitMaybe)
        missing.push("unit");
    if (Number.isNaN(quantity))
        missing.push("quantity");
    if (Number.isNaN(pricePerUnit))
        missing.push("pricePerUnit");
    if (missing.length) {
        const err = new Error(`Invalid or missing fields: ${missing.join(", ")}`);
        err.status = 400;
        throw err;
    }
    // À partir d'ici, TS sait encore "string | null". On fixe en string via const locales.
    const name = nameMaybe;
    const unit = unitMaybe;
    return {
        name,
        quantity,
        unit,
        pricePerUnit,
        countryOfOrigin: trimOrNull(r?.countryOfOrigin),
        category: trimOrNull(r?.category),
        subcategory: trimOrNull(r?.subcategory),
        description: trimOrNull(r?.description),
        hsCode: trimOrNull(r?.hsCode),
        incoterm: trimOrNull(r?.incoterm),
        minOrderQty: toNumOrNull(r?.minOrderQty),
        leadTimeDays: toNumOrNull(r?.leadTimeDays),
        producerWalletId: trimOrNull(r?.producerWalletId) || null,
    };
}
//# sourceMappingURL=normalize.js.map