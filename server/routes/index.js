const router = require('express').Router();

router.use('/products', require('./product'));

module.exports = router;
