/**
 * YOURLS-MCP: Main entry point
 */
const { McpServer } = require('@modelcontextprotocol/sdk');
const { loadConfig, validateConfig } = require('./config');
const YourlsClient = require('./api');
const { registerTools } = require('./tools');

/**
 * Create and configure MCP server for YOURLS
 * 
 * @param {string} configPath - Path to config file (optional)
 * @returns {object} Configured MCP server
 */
function createServer(configPath) {
  // Load and validate configuration
  const config = loadConfig(configPath);
  validateConfig(config);

  // Create YOURLS client
  const yourlsClient = new YourlsClient(config.yourls);
  
  // Create MCP server
  const server = new McpServer({
    name: 'YOURLS URL Shortener',
    version: '0.1.0'
  });
  
  // Register tools
  registerTools(server, yourlsClient);
  
  return server;
}

module.exports = {
  createServer
};