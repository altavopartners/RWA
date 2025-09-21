import { Prisma } from '@prisma/client';           // << valeur (pas "type")
import prisma from '../lib/prisma';
import { imgDir, docDir } from '../config/uploads';
import { createProductNFT } from "./web3nft.service"; // <- the Hedera mint service

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

  // 1) create first (PENDING)
  const created = await prisma.product.create({
    data: {
      ...(body as any),
      images: imagesValue,
      documents: documentsValue,
      nftStatus: "PENDING", // <-- added
    },
  });

  // 2) try to mint NFT using the created data
  try {
    const name = String(created.name);
    const quantity = Math.max(1, Number(created.quantity)); // guard rails
    const countryOfOrigin = String(created.countryOfOrigin);
    const pricePerUnit = Number(created.pricePerUnit);
    const hsCode = created.hsCode ?? undefined;

    const { tokenId, serials } = await createProductNFT({
      name,
      quantity,
      countryOfOrigin,
      pricePerUnit,
      hsCode,
    });

    // 3) update the same row with on-chain refs
    const updated = await prisma.product.update({
      where: { id: created.id },
      data: {
        hederaTokenId: tokenId,
        hederaSerials: serials,
        nftStatus: "MINTED",
      },
    });

    return updated;
  } catch (e) {
    // keep product; just mark as FAILED
    const failed = await prisma.product.update({
      where: { id: created.id },
      data: { nftStatus: "FAILED" },
    });
    return failed;
  }
}





// // body volontairement souple : normalisations possibles (null/undefined)
// export async function createProduct(
//   body: Record<string, unknown>,
//   files: ProductFiles
// ) {
//   const images = filesToMeta(files?.images ?? []);
//   const documents = filesToMeta(files?.documents ?? []);

//   // Champs JSON NULLABLE : utiliser DbNull pour "null"
//   const imagesValue: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue =
//     images.length ? (images as unknown as Prisma.InputJsonValue) : Prisma.DbNull;

//   const documentsValue: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue =
//     documents.length ? (documents as unknown as Prisma.InputJsonValue) : Prisma.DbNull;

//   return prisma.product.create({
//     data: {
//       ...(body as any),
//       images: imagesValue,
//       documents: documentsValue,
//     },
//   });
// }

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
  if (typeof idParam === 'number' || /^\d+$/.test(String(idParam))) {
    const id = typeof idParam === 'number' ? idParam : Number(idParam);
    return prisma.product.findUnique({ where: { id } });
  }
  // sinon, pas de PK string -> on ne peut pas faire findUnique
  return null;
}
