// buildProductBody + helpers mirrored from your current code

function toNumOrNull(v) {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function trimOrNull(v) {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t === '' ? null : t;
}
function trimOrUndefined(v) {
  return typeof v === 'string' ? v.trim() : undefined;
}
function parseBool(v) {
  if (v === undefined) return undefined;
  if (typeof v === 'boolean') return v;
  const s = String(v).toLowerCase().trim();
  if (['1','true','yes','y'].includes(s)) return true;
  if (['0','false','no','n'].includes(s)) return false;
  return undefined;
}
function toInt(v, def) {
  if (v === undefined || v === null || v === '') return def;
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

function buildProductBody(raw) {
  const name = trimOrNull(raw.name);
  const quantity = Number(raw.quantity);
  const pricePerUnit = Number(raw.pricePerUnit);

  if (!name || Number.isNaN(quantity) || Number.isNaN(pricePerUnit)) {
    const missing = [];
    if (!name) missing.push('name');
    if (Number.isNaN(quantity)) missing.push('quantity');
    if (Number.isNaN(pricePerUnit)) missing.push('pricePerUnit');
    const err = new Error(`Invalid or missing fields: ${missing.join(', ')}`);
    err.status = 400;
    throw err;
  }

  return {
    name,
    quantity,
    unit: trimOrNull(raw.unit),
    pricePerUnit,
    countryOfOrigin: trimOrNull(raw.countryOfOrigin),
    category: trimOrNull(raw.category),
    subcategory: trimOrNull(raw.subcategory),
    description: trimOrNull(raw.description),
    hsCode: trimOrNull(raw.hsCode),
    incoterm: trimOrNull(raw.incoterm),
    minOrderQty: toNumOrNull(raw.minOrderQty),
    leadTimeDays: toNumOrNull(raw.leadTimeDays),
  };
}

module.exports = {
  buildProductBody,
  trimOrUndefined,
  parseBool,
  toInt,
};
