// utils/normalize.ts

export function toNumOrNull(v: unknown): number | null {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function trimOrNull(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t === '' ? null : t;
}

export function trimOrUndefined(v: unknown): string | undefined {
  return typeof v === 'string' ? v.trim() : undefined;
}

export function parseBool(v: unknown): boolean | undefined {
  if (v === undefined) return undefined;
  if (typeof v === 'boolean') return v;
  const s = String(v).toLowerCase().trim();
  if (['1', 'true', 'yes', 'y'].includes(s)) return true;
  if (['0', 'false', 'no', 'n'].includes(s)) return false;
  return undefined;
}

export function toInt(v: unknown, def: number): number {
  if (v === undefined || v === null || v === '') return def;
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

export type ProductBody = {
  name: string;
  quantity: number;
  unit: string;          // requis
  pricePerUnit: number;

  countryOfOrigin: string | null;
  category: string | null;
  subcategory: string | null;
  description: string | null;
  hsCode: string | null;
  incoterm: string | null;

  minOrderQty: number | null;
  leadTimeDays: number | null;

  producerWalletId?: string | null;
};

export function buildProductBody(raw: unknown): ProductBody {
  const r = raw as Record<string, unknown>;

  const nameMaybe = trimOrNull(r?.name);
  const unitMaybe = trimOrNull(r?.unit);
  const quantity = Number(r?.quantity);
  const pricePerUnit = Number(r?.pricePerUnit);

  const missing: string[] = [];
  if (!nameMaybe) missing.push('name');
  if (!unitMaybe) missing.push('unit');
  if (Number.isNaN(quantity)) missing.push('quantity');
  if (Number.isNaN(pricePerUnit)) missing.push('pricePerUnit');

  if (missing.length) {
    const err: any = new Error(`Invalid or missing fields: ${missing.join(', ')}`);
    err.status = 400;
    throw err;
  }

  // À partir d'ici, TS sait encore "string | null". On fixe en string via const locales.
  const name: string = nameMaybe as string;
  const unit: string = unitMaybe as string;

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
