// Vercel Serverless Function entry point
// All /api/* requests are handled here by the Express app

const app = require('../backend/src/server');

module.exports = app;
