#!/usr/bin/env node

/**
 * YOURLS-MCP CLI entry point
 */
const { createServer } = require('../src');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
let configPath = null;
const configIndex = args.indexOf('--config');

if (configIndex !== -1 && args.length > configIndex + 1) {
  configPath = args[configIndex + 1];
}

// Create and start server
try {
  const server = createServer(configPath);
  server.listen();
  console.log('YOURLS-MCP server started');
} catch (error) {
  console.error(`Error starting YOURLS-MCP server: ${error.message}`);
  process.exit(1);
}