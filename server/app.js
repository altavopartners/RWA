const path = require('path');
const express = require('express');
const cors = require('cors');

const { corsOptions } = require('./config/cors');
const { ensureUploadDirs, rootUpload } = require('./config/uploads');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// JSON parsing
app.use(express.json());

// CORS
app.use(cors(corsOptions));
// preflight (helpful with complex requests)
app.options('*', cors(corsOptions));

// make sure upload dirs exist
ensureUploadDirs();

// serve uploaded files in dev
app.use('/uploads', express.static(rootUpload));

// health
app.get('/', (_req, res) => res.send('Hex-Port backend is running'));

// API routes
app.use('/api', routes);

// central error handler
app.use(errorHandler);

module.exports = app;
