import { Prisma } from '@prisma/client';           // << valeur (pas "type")
import prisma from '../lib/prisma';
import { imgDir, docDir } from '../config/uploads';

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

// body volontairement souple : normalisations possibles (null/undefined)
export async function createProduct(
  body: Record<string, unknown>,
  files: ProductFiles
) {
  const images = filesToMeta(files?.images ?? []);
  const documents = filesToMeta(files?.documents ?? []);

  // Champs JSON NULLABLE : utiliser DbNull pour "null"
  const imagesValue: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue =
    images.length ? (images as unknown as Prisma.InputJsonValue) : Prisma.DbNull;

  const documentsValue: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue =
    documents.length ? (documents as unknown as Prisma.InputJsonValue) : Prisma.DbNull;

  return prisma.product.create({
    data: {
      ...(body as any),
      images: imagesValue,
      documents: documentsValue,
    },
  });
}

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
