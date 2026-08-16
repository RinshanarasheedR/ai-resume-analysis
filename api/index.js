// Vercel Serverless Function Entry Point
// This file wraps the Express backend app for Vercel's serverless runtime
const app = require('../backend/server');

module.exports = app;
