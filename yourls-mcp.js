#!/usr/bin/env node

/**
 * YOURLS-MCP CLI entry point
 */
import { createServer } from './src/index.js';

// Create and start server
try {
  const server = createServer();
  server.listen();
  // Don't log to stdout, use stderr for diagnostics
} catch (error) {
  process.stderr.write(`Error starting YOURLS-MCP server: ${error.message}\n`);
  process.exit(1);
}