/**
 * Tool registration module
 */
import createShortenUrlTool from './shortenUrl.js';
import createExpandUrlTool from './expandUrl.js';
import createUrlStatsTool from './urlStats.js';
import createDbStatsTool from './dbStats.js';
import createShortUrlAnalyticsTool from './shortUrlAnalytics.js';

/**
 * Register all tools with the MCP server
 * 
 * @param {object} server - MCP server instance
 * @param {object} yourlsClient - YOURLS API client
 */
export function registerTools(server, yourlsClient) {
  const shortenUrlTool = createShortenUrlTool(yourlsClient);
  const expandUrlTool = createExpandUrlTool(yourlsClient);
  const urlStatsTool = createUrlStatsTool(yourlsClient);
  const dbStatsTool = createDbStatsTool(yourlsClient);
  const shortUrlAnalyticsTool = createShortUrlAnalyticsTool(yourlsClient);
  
  server.addTool(shortenUrlTool);
  server.addTool(expandUrlTool);
  server.addTool(urlStatsTool);
  server.addTool(dbStatsTool);
  server.addTool(shortUrlAnalyticsTool);
}