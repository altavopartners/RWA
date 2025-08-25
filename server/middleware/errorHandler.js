// middleware/errorHandler.js
const multer = require('multer');

module.exports = function errorHandler(err, _req, res, _next) {
  console.error('[ERROR]', err); // keep full stack in server console

  if (err instanceof multer.MulterError) {
    // file too big, too many files, etc.
    const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    return res.status(status).json({ error: err.message });
  }

  const status = err.status || 500;
  return res.status(status).json({ error: err.message || 'Server error' });
};
