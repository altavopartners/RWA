const { buildProductBody, trimOrUndefined, parseBool, toInt } = require('../utils/normalize');
const { createProduct, listProducts, findProductById } = require('../services/product');

// POST /api/products
async function postProduct(req, res, next) {
  try {
    const body = buildProductBody(req.body);
    const created = await createProduct(body, req.files);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}

// GET /api/products
async function getProducts(req, res, next) {
  try {
    const page = Math.max(1, toInt(req.query.page, 1));
    const rawSize = Math.max(1, toInt(req.query.pageSize, 20));
    const pageSize = Math.min(rawSize, 100);
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const allowedSort = new Set(['createdAt', 'name', 'pricePerUnit', 'quantity']);
    const sortBy = allowedSort.has(String(req.query.sortBy)) ? String(req.query.sortBy) : 'createdAt';
    const sortOrder = (req.query.sortOrder === 'asc') ? 'asc' : 'desc';

    const q           = trimOrUndefined(req.query.q);
    const category    = trimOrUndefined(req.query.category);
    const subcategory = trimOrUndefined(req.query.subcategory);
    const country     = trimOrUndefined(req.query.country);
    const minPrice    = req.query.minPrice !== undefined ? Number(req.query.minPrice) : null;
    const maxPrice    = req.query.maxPrice !== undefined ? Number(req.query.maxPrice) : null;
    const hasImages   = parseBool(req.query.hasImages);
    const hasDocuments= parseBool(req.query.hasDocuments);

    const where = {};
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

    if (hasImages !== undefined)   where.images   = hasImages   ? { not: null } : null;
    if (hasDocuments !== undefined)where.documents= hasDocuments? { not: null } : null;

    const { total, items } = await listProducts({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip, take,
    });

    res.json({
      data: items,
      page, pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      sortBy, sortOrder,
      filters: { q, category, subcategory, country, minPrice, maxPrice, hasImages, hasDocuments },
    });
  } catch (err) {
    next(err);
  }
}
async function getProductById(req, res, next) {
  try {
    const idParam = String(req.params.id);

    // Accept numeric IDs or string/UUID IDs
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
module.exports = { postProduct, getProducts, getProductById };
