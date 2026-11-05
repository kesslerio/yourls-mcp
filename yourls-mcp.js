#!/usr/bin/env node

/**
 * YOURLS-MCP CLI entry point
 */
import { createServer } from './src/index.js';

const args = process.argv.slice(2);

const optionValue = (flag) => {
  const index = args.indexOf(flag);
  return index !== -1 && index + 1 < args.length ? args[index + 1] : undefined;
};

const useHttp = args.includes('--http');
const port = parseInt(optionValue('--port') ?? '3133', 10);
const bind = optionValue('--bind') ?? '127.0.0.1';

// Create and start server
try {
  const server = createServer({
    transport: useHttp ? 'http' : 'stdio',
    port,
    bind
  });
  server.listen();
  // Don't log to stdout, use stderr for diagnostics
} catch (error) {
  process.stderr.write(`Error starting YOURLS-MCP server: ${error.message}\n`);
  process.exit(1);
}
