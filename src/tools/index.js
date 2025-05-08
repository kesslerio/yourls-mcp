/**
 * Tool registration module
 */
const createShortenUrlTool = require('./shortenUrl');
const createExpandUrlTool = require('./expandUrl');
const createUrlStatsTool = require('./urlStats');
const createDbStatsTool = require('./dbStats');

/**
 * Register all tools with the MCP server
 * 
 * @param {object} server - MCP server instance
 * @param {object} yourlsClient - YOURLS API client
 */
function registerTools(server, yourlsClient) {
  const shortenUrlTool = createShortenUrlTool(yourlsClient);
  const expandUrlTool = createExpandUrlTool(yourlsClient);
  const urlStatsTool = createUrlStatsTool(yourlsClient);
  const dbStatsTool = createDbStatsTool(yourlsClient);
  
  server.addTool(shortenUrlTool);
  server.addTool(expandUrlTool);
  server.addTool(urlStatsTool);
  server.addTool(dbStatsTool);
}

module.exports = {
  registerTools
};