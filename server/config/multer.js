const multer = require('multer');
const path = require('path');
const { rootUpload, imgDir, docDir } = require('./uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'images') return cb(null, imgDir);
    if (file.fieldname === 'documents') return cb(null, docDir);
    cb(null, rootUpload);
  },
  filename: (_req, file, cb) => {
    const safe = (file.originalname || 'file').replace(/\s+/g, '_');
    cb(null, `${Date.now()}_${Math.round(Math.random()*1e9)}_${safe}`);
  }
});

const imgTypes = ['image/png','image/jpeg','image/webp','image/gif'];
const docTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ...imgTypes
];

function fileFilter(req, file, cb) {
  if (file.fieldname === 'images' && !imgTypes.includes(file.mimetype)) {
    return cb(new Error("Only image files allowed in 'images'"));
  }
  if (file.fieldname === 'documents' && !docTypes.includes(file.mimetype)) {
    return cb(new Error("Unsupported file type for 'documents'"));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024, files: 20 }
});

// ready-to-use field config for product endpoints
const productUpload = upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'documents', maxCount: 10 },
]);

module.exports = { upload, productUpload, imgTypes, docTypes };
