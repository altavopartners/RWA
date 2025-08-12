// server/index.js
require('dotenv').config();
const cors = require('cors');
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const prisma = new PrismaClient();

// --- JSON body for non-file submissions
app.use(express.json());


const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

app.use(cors({
  origin(origin, cb) {
    // allow server-to-server / Postman / same-origin (no Origin header)
    if (!origin) return cb(null, true);
    return allowedOrigins.includes(origin)
      ? cb(null, true)
      : cb(new Error('Not allowed by CORS'));
  },
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,         // only if you send cookies/auth
  maxAge: 600,               // cache preflight for 10 minutes
}));

// (optional, but helpful) handle preflight for all routes
app.options('*', cors());

// --- ensure upload folders exist
const rootUpload = path.join(__dirname, 'uploads');
const imgDir = path.join(rootUpload, 'images');
const docDir = path.join(rootUpload, 'documents');
[rootUpload, imgDir, docDir].forEach((p) => {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

// --- static serving of uploaded files (dev)
app.use('/uploads', express.static(rootUpload));

// --- Multer storage: route by field name
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'images') return cb(null, imgDir);
    if (file.fieldname === 'documents') return cb(null, docDir);
    // default fallback
    cb(null, rootUpload);
  },
  filename: (req, file, cb) => {
    const safe = (file.originalname || 'file').replace(/\s+/g, '_');
    cb(null, `${Date.now()}_${Math.round(Math.random() * 1e9)}_${safe}`);
  }
});

// Optional: basic MIME filtering
const fileFilter = (req, file, cb) => {
  const imgTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
  const docTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ...imgTypes
  ];

  if (file.fieldname === 'images' && !imgTypes.includes(file.mimetype)) {
    return cb(new Error("Only image files allowed in 'images'"));
  }
  if (file.fieldname === 'documents' && !docTypes.includes(file.mimetype)) {
    return cb(new Error("Unsupported file type for 'documents'"));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024, files: 20 } // tweak as needed
});

// Helper: normalize/validate the incoming fields
function buildProductBody(raw) {
  const n = (v) => (v === undefined || v === null || v === '' ? null : Number(v));
  const t = (v) => (typeof v === 'string' ? v.trim() : v);

  const quantity = Number(raw.quantity);
  const pricePerUnit = Number(raw.pricePerUnit);
  if (!t(raw.name) || Number.isNaN(quantity) || Number.isNaN(pricePerUnit)) {
    const missing = [];
    if (!t(raw.name)) missing.push('name');
    if (Number.isNaN(quantity)) missing.push('quantity');
    if (Number.isNaN(pricePerUnit)) missing.push('pricePerUnit');
    const msg = `Invalid or missing fields: ${missing.join(', ')}`;
    const err = new Error(msg); err.status = 400; throw err;
  }

  return {
    name: t(raw.name),
    quantity,
    unit: t(raw.unit),
    pricePerUnit,
    countryOfOrigin: t(raw.countryOfOrigin),
    category: t(raw.category),
    subcategory: t(raw.subcategory) || null,
    description: t(raw.description),
    hsCode: t(raw.hsCode) || null,
    incoterm: t(raw.incoterm) || null,
    minOrderQty: n(raw.minOrderQty),
    leadTimeDays: n(raw.leadTimeDays),
  };
}

app.post(
  '/api/products',
  upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'documents', maxCount: 10 },
  ]),
  async (req, res) => {
    try {
      const body = buildProductBody(req.body);

      const toMeta = (arr = []) =>
        arr.map((f) => ({
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

      const images = toMeta((req.files && req.files.images) || []);
      const documents = toMeta((req.files && req.files.documents) || []);

      const created = await prisma.product.create({
        data: {
          ...body,
          images: images.length ? images : null,       // Prisma Json? field
          documents: documents.length ? documents : null
        }
      });

      res.status(201).json(created);
    } catch (err) {
      console.error(err);
      res.status(err.status || 500).json({ error: err.message || 'Server error' });
    }
  }
);

app.get('/', (req, res) => {
  res.send('Hex-Port backend is running');
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API listening on :${port}`));



// GET /api/products
// Query params:
//   page, pageSize
//   q (search in name/desc/category/subcategory/countryOfOrigin/hsCode)
//   category, subcategory, country (countryOfOrigin)
//   minPrice, maxPrice
//   hasImages=true|false, hasDocuments=true|false
//   sortBy=name|pricePerUnit|quantity|createdAt (default createdAt)
//   sortOrder=asc|desc (default desc)
app.get('/api/products', async (req, res) => {
  try {
    // ---- helpers
    const n = (v, def = null) => {
      if (v === undefined || v === null || v === '') return def;
      const num = Number(v);
      return Number.isFinite(num) ? num : def;
    };
    const b = (v) => {
      if (v === undefined) return undefined;
      if (typeof v === 'boolean') return v;
      const s = String(v).toLowerCase().trim();
      if (['1','true','yes','y'].includes(s)) return true;
      if (['0','false','no','n'].includes(s)) return false;
      return undefined;
    };
    const s = (v) => (typeof v === 'string' ? v.trim() : undefined);

    // ---- pagination
    const page = Math.max(1, n(req.query.page, 1));
    const rawSize = Math.max(1, n(req.query.pageSize, 20));
    const pageSize = Math.min(rawSize, 100); // hard cap
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    // ---- sorting (allowlist to avoid Prisma errors)
    const allowedSort = new Set(['createdAt', 'name', 'pricePerUnit', 'quantity']);
    const sortBy = allowedSort.has(String(req.query.sortBy)) ? String(req.query.sortBy) : 'createdAt';
    const sortOrder = (req.query.sortOrder === 'asc') ? 'asc' : 'desc';

    // ---- filters
    const q = s(req.query.q);
    const category = s(req.query.category);
    const subcategory = s(req.query.subcategory);
    const country = s(req.query.country);
    const minPrice = n(req.query.minPrice);
    const maxPrice = n(req.query.maxPrice);
    const hasImages = b(req.query.hasImages);
    const hasDocuments = b(req.query.hasDocuments);

    /** Prisma where */
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
    if (category) where.category = category;
    if (subcategory) where.subcategory = subcategory;
    if (country) where.countryOfOrigin = country;

    if (minPrice !== null || maxPrice !== null) {
      where.pricePerUnit = {};
      if (minPrice !== null) where.pricePerUnit.gte = minPrice;
      if (maxPrice !== null) where.pricePerUnit.lte = maxPrice;
    }

    // JSON fields: you can only reliably check null/not null
    if (hasImages !== undefined) {
      where.images = hasImages ? { not: null } : null;
    }
    if (hasDocuments !== undefined) {
      where.documents = hasDocuments ? { not: null } : null;
    }

    // ---- query
    const [total, items] = await prisma.$transaction([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take,
      }),
    ]);

    res.json({
      data: items,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      sortBy,
      sortOrder,
      filters: {
        q, category, subcategory, country,
        minPrice, maxPrice,
        hasImages, hasDocuments,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});
