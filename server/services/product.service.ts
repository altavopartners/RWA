// products.service.ts
import { Prisma } from "@prisma/client"; // valeur (pas "type")
import prisma from "../lib/prisma";
import { imgDir, docDir } from "../config/uploads";
import {
  CreateNftService,
  MintProductNftService,
  type NFTDataInput,
  type NFTMintInput,
} from "./web3nft.service"; // ⬅️ switched to the new services

export interface UploadedMeta {
  filename: string;
  originalName: string;
  size: number;
  mime: string;
  path: string;
}

export type ProductFiles = Record<string, Express.Multer.File[]> | undefined;

function filesToMeta(arr: Express.Multer.File[] = []): UploadedMeta[] {
  return arr.map((f) => ({
    filename: f.filename,
    originalName: f.originalname,
    size: f.size,
    mime: f.mimetype,
    path:
      f.destination === imgDir
        ? `/uploads/images/${f.filename}`
        : f.destination === docDir
        ? `/uploads/documents/${f.filename}`
        : `/uploads/${f.filename}`,
  }));
}

/* -------------------------- Mapping helpers (NEW) -------------------------- */

function toCreateDataInput(src: {
  name: unknown;
  quantity: unknown;
  memo?: unknown;
  autoRenewAccountId?: unknown;
  autoRenewPeriodSeconds?: unknown;
}): NFTDataInput {
  return {
    name: String(src.name ?? ""),
    quantity: Math.max(1, Number(src.quantity ?? 1)),
    memo: src.memo == null ? undefined : String(src.memo),
    autoRenewAccountId:
      src.autoRenewAccountId == null ? undefined : String(src.autoRenewAccountId),
    autoRenewPeriodSeconds:
      src.autoRenewPeriodSeconds == null
        ? undefined
        : Math.max(1, Number(src.autoRenewPeriodSeconds)),
  };
}

function toMintInput(src: {
  name: unknown;
  quantity: unknown;
  countryOfOrigin?: unknown;
  pricePerUnit?: unknown;
  hsCode?: unknown;
}): NFTMintInput {
  return {
    name: String(src.name ?? ""),
    quantity: Math.max(1, Number(src.quantity ?? 1)),
    countryOfOrigin:
      src.countryOfOrigin == null ? undefined : String(src.countryOfOrigin),
    pricePerUnit:
      src.pricePerUnit == null ? undefined : Number(src.pricePerUnit),
    hsCode: src.hsCode == null ? undefined : String(src.hsCode),
  };
}

/* --------------------------------- Create --------------------------------- */

export async function createProduct(
  body: Record<string, unknown>,
  files: ProductFiles
) {
  const images = filesToMeta(files?.images ?? []);
  const documents = filesToMeta(files?.documents ?? []);

  // Champs JSON NULLABLE : utiliser DbNull pour "null"
  const imagesValue:
    | Prisma.NullableJsonNullValueInput
    | Prisma.InputJsonValue =
    images.length
      ? (images as unknown as Prisma.InputJsonValue)
      : Prisma.DbNull;

  const documentsValue:
    | Prisma.NullableJsonNullValueInput
    | Prisma.InputJsonValue =
    documents.length
      ? (documents as unknown as Prisma.InputJsonValue)
      : Prisma.DbNull;

  // 1) Create product row (PENDING)
  const created = await prisma.product.create({
    data: {
      ...(body as any),
      images: imagesValue,
      documents: documentsValue,
      nftStatus: "PENDING",
    },
  });

  // 2) Create token on-chain (NO mint here) with the new service
  const createInput = toCreateDataInput(created as any);
  const { tokenId } = await CreateNftService.createFull(createInput); // ⬅️ no mintInput

  // 3) Persist chain refs
  const updated = await prisma.product.update({
    where: { id: (created as any).id },
    data: {
      hederaTokenId: tokenId,
      // keep PENDING until we mint, or set to 'CREATED' if you prefer
      nftStatus: "PENDING",
    },
  });

  return updated;
}

/* ---------------------------------- Mint ---------------------------------- */

export async function mintProduct(body: Record<string, unknown>) {
  // 1) resolve id and fetch product
  const rawId = (body as any).id;
  const id = typeof rawId === "number" ? rawId : Number(rawId);
  if (!Number.isFinite(id)) throw new Error("Invalid product id");

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new Error("Product not found");
  if (!product.hederaTokenId) throw new Error("Token not created for this product");

  try {
    // 2) Prepare mint input and mint serials via the new service
    const input = toMintInput(product as any);
    const serials = await MintProductNftService.mint(product.hederaTokenId, input);

    // 3) Update row
    const updated = await prisma.product.update({
      where: { id: product.id },
      data: {
        hederaSerials: serials.length, // store count; or store full list if schema supports JSON
        nftStatus: "MINTED",
      },
    });

    return updated;
  } catch (e) {
    // mark as FAILED but keep record
    await prisma.product.update({
      where: { id: product.id },
      data: { nftStatus: "FAILED" },
    });
    throw e;
  }
}

/* --------------------------------- Queries -------------------------------- */

export type ListProductsParams = {
  where?: Prisma.ProductWhereInput;
  orderBy?:
    | Prisma.ProductOrderByWithRelationInput
    | Prisma.ProductOrderByWithRelationInput[];
  skip?: number;
  take?: number;
};

export async function listProducts(params: ListProductsParams) {
  const { where, orderBy, skip, take } = params;

  const [total, items] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({ where, orderBy, skip, take }),
  ]);

  return { total, items };
}

export async function findProductById(idParam: number | string) {
  // si ton PK est Int
  if (typeof idParam === "number" || /^\d+$/.test(String(idParam))) {
    const id = typeof idParam === "number" ? idParam : Number(idParam);
    return prisma.product.findUnique({ where: { id } });
  }
  // sinon, pas de PK string -> on ne peut pas faire findUnique
  return null;
}
