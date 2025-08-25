const fs = require('fs');
const path = require('path');

const rootUpload = path.join(__dirname, '..', 'uploads');
const imgDir    = path.join(rootUpload, 'images');
const docDir    = path.join(rootUpload, 'documents');

function ensureUploadDirs() {
  [rootUpload, imgDir, docDir].forEach(p => {
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  });
}

module.exports = { rootUpload, imgDir, docDir, ensureUploadDirs };
