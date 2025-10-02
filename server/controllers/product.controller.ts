import { Request, Response, NextFunction } from 'express';
import { buildProductBody, trimOrUndefined, parseBool, toInt } from '../utils/normalize';
import { createProduct, listProducts, findProductById } from '../services/product.service';

// POST /api/products
export async function postProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const body = buildProductBody(req.body);
    // Multer .fields() -> Record<string, Express.Multer.File[]>
    const files = req.files as Record<string, Express.Multer.File[]> | undefined;
    const created = await createProduct(body, files); // OK: service accepte un body souple
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}

// GET /api/products
export async function getProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, toInt(req.query.page as string, 1));
    const rawSize = Math.max(1, toInt(req.query.pageSize as string, 99));
    const pageSize = Math.min(rawSize, 100);
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const allowedSort = new Set(['createdAt', 'name', 'pricePerUnit', 'quantity']);
    const sortBy = allowedSort.has(String(req.query.sortBy))
      ? String(req.query.sortBy)
      : 'createdAt';
    const sortOrder: 'asc' | 'desc' = req.query.sortOrder === 'asc' ? 'asc' : 'desc';

    const q           = trimOrUndefined(req.query.q as string);
    const category    = trimOrUndefined(req.query.category as string);
    const subcategory = trimOrUndefined(req.query.subcategory as string);
    const country     = trimOrUndefined(req.query.country as string);
    const minPrice    = req.query.minPrice !== undefined ? Number(req.query.minPrice) : null;
    const maxPrice    = req.query.maxPrice !== undefined ? Number(req.query.maxPrice) : null;
    const hasImages   = parseBool(req.query.hasImages as string);
    const hasDocuments= parseBool(req.query.hasDocuments as string);

    const where: any = {};
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { category: { contains: q, mode: 'insensitive' } },
        { subcategory: { contains: q, mode: 'insensitive' } },
        { countryOfOrigin: { contains: q, mode: 'insensitive' } },
        { hsCode: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (category)    where.category = category;
    if (subcategory) where.subcategory = subcategory;
    if (country)     where.countryOfOrigin = country;

    if (minPrice !== null || maxPrice !== null) {
      where.pricePerUnit = {};
      if (minPrice !== null) where.pricePerUnit.gte = minPrice;
      if (maxPrice !== null) where.pricePerUnit.lte = maxPrice;
    }

    if (hasImages !== undefined)    where.images    = hasImages    ? { not: null } : null;
    if (hasDocuments !== undefined) where.documents = hasDocuments ? { not: null } : null;

    const { total, items } = await listProducts({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take,
    });

    res.json({
      data: items,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      sortBy,
      sortOrder,
      filters: { q, category, subcategory, country, minPrice, maxPrice, hasImages, hasDocuments },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/products/:id
export async function getProductById(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) {
  try {
    const idParam = String(req.params.id);
    const id = /^\d+$/.test(idParam) ? Number(idParam) : idParam;

    const product = await findProductById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (err) {
    next(err);
  }
}
