const prisma = require('../lib/prisma');
const { imgDir, docDir } = require('../config/uploads');
const path = require('path');

function filesToMeta(arr = []) {
  return arr.map(f => ({
    filename: f.filename,
    originalName: f.originalname,
    size: f.size,
    mime: f.mimetype,
    path:
      f.destination === imgDir
        ? `/uploads/images/${f.filename}`
        : f.destination === docDir
          ? `/uploads/documents/${f.filename}`
          : `/uploads/${f.filename}`
  }));
}

async function createProduct(body, files) {
  const images = filesToMeta((files && files.images) || []);
  const documents = filesToMeta((files && files.documents) || []);

  return prisma.product.create({
    data: {
      ...body,
      images: images.length ? images : null,     // Prisma Json fields
      documents: documents.length ? documents : null,
    }
  });
}

async function listProducts(params) {
  const {
    where, orderBy, skip, take,
  } = params;

  const [total, items] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({ where, orderBy, skip, take }),
  ]);

  return { total, items };
}

async function findProductById(idParam) {
  // Accept both numeric (Int PK) and string/UUID PK
  const id = /^\d+$/.test(String(idParam)) ? Number(idParam) : String(idParam);

  return prisma.product.findUnique({
    where: { id },
    // No `include` here — JSON scalar fields (images/documents) are returned by default
  });
}

module.exports = { createProduct, listProducts, findProductById };
