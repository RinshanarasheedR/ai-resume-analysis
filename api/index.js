/**
 * Vercel serverless entry point.
 * Routes all /api/* requests from Vercel to the Express app in backend/server.js
 */
module.exports = require('../backend/server');
