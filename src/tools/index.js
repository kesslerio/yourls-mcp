/**
 * Tool registration module
 */
import createShortenUrlTool from './shortenUrl.js';
import createExpandUrlTool from './expandUrl.js';
import createUrlStatsTool from './urlStats.js';
import createDbStatsTool from './dbStats.js';
import createShortUrlAnalyticsTool from './shortUrlAnalytics.js';
import createContractUrlTool from './contractUrl.js';
import createUpdateUrlTool from './updateUrl.js';
import createChangeKeywordTool from './changeKeyword.js';
import createGetUrlKeywordTool from './getUrlKeyword.js';
import createDeleteUrlTool from './deleteUrl.js';
import createListUrlsTool from './listUrls.js';

/**
 * Register all tools with the MCP server
 * 
 * @param {object} server - MCP server instance
 * @param {object} yourlsClient - YOURLS API client
 */
export function registerTools(server, yourlsClient) {
  // Core YOURLS API tools
  const shortenUrlTool = createShortenUrlTool(yourlsClient);
  const expandUrlTool = createExpandUrlTool(yourlsClient);
  const urlStatsTool = createUrlStatsTool(yourlsClient);
  const dbStatsTool = createDbStatsTool(yourlsClient);
  
  // Plugin-based API tools
  const shortUrlAnalyticsTool = createShortUrlAnalyticsTool(yourlsClient);
  const contractUrlTool = createContractUrlTool(yourlsClient);
  const updateUrlTool = createUpdateUrlTool(yourlsClient);
  const changeKeywordTool = createChangeKeywordTool(yourlsClient);
  const getUrlKeywordTool = createGetUrlKeywordTool(yourlsClient);
  const deleteUrlTool = createDeleteUrlTool(yourlsClient);
  const listUrlsTool = createListUrlsTool(yourlsClient);
  
  // Register core tools
  server.addTool(shortenUrlTool);
  server.addTool(expandUrlTool);
  server.addTool(urlStatsTool);
  server.addTool(dbStatsTool);
  
  // Register plugin-based tools
  server.addTool(shortUrlAnalyticsTool);
  server.addTool(contractUrlTool);
  server.addTool(updateUrlTool);
  server.addTool(changeKeywordTool);
  server.addTool(getUrlKeywordTool);
  server.addTool(deleteUrlTool);
  server.addTool(listUrlsTool);
}