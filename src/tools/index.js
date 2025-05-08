/**
 * Tool registration module
 */
import { z } from 'zod';
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
import createGenerateQrCodeTool from './generateQrCode.js';
import createShortenWithAnalyticsTool from './shortenWithAnalytics.js';
import createCustomUrlTool from './createCustomUrl.js';

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
  const generateQrCodeTool = createGenerateQrCodeTool(yourlsClient);
  const customUrlTool = createCustomUrlTool(yourlsClient);
  
  // Helper function to convert schema to zod properties
  const schemaToZodProperties = (schema) => {
    if (!schema || !schema.properties) {
      return {};
    }
    
    const zodProps = {};
    
    // Convert each property to a zod schema
    Object.keys(schema.properties).forEach(key => {
      const prop = schema.properties[key];
      const isRequired = schema.required && schema.required.includes(key);
      
      let zodProp = z.string();
      
      // Add description if available
      if (prop.description) {
        zodProp = zodProp.describe(prop.description);
      }
      
      // Make optional if not required
      if (!isRequired) {
        zodProp = zodProp.optional();
      }
      
      zodProps[key] = zodProp;
    });
    
    return zodProps;
  };

  // Register core tools using server.tool() method
  server.tool(
    shortenUrlTool.name,
    shortenUrlTool.description,
    {
      url: shortenUrlTool.inputSchema.properties.url.description ? 
           z.string().describe(shortenUrlTool.inputSchema.properties.url.description) : 
           z.string(),
      keyword: shortenUrlTool.inputSchema.properties.keyword.description ? 
              z.string().optional().describe(shortenUrlTool.inputSchema.properties.keyword.description) : 
              z.string().optional(),
      title: shortenUrlTool.inputSchema.properties.title.description ? 
            z.string().optional().describe(shortenUrlTool.inputSchema.properties.title.description) : 
            z.string().optional()
    },
    shortenUrlTool.execute
  );
  
  server.tool(
    expandUrlTool.name,
    expandUrlTool.description,
    {
      shorturl: expandUrlTool.inputSchema.properties.shorturl.description ? 
               z.string().describe(expandUrlTool.inputSchema.properties.shorturl.description) : 
               z.string()
    },
    expandUrlTool.execute
  );
  
  server.tool(
    urlStatsTool.name,
    urlStatsTool.description,
    {
      shorturl: urlStatsTool.inputSchema.properties.shorturl.description ? 
               z.string().describe(urlStatsTool.inputSchema.properties.shorturl.description) : 
               z.string()
    },
    urlStatsTool.execute
  );
  
  server.tool(
    dbStatsTool.name,
    dbStatsTool.description,
    {},
    dbStatsTool.execute
  );
  
  // Register plugin-based tools
  server.tool(
    shortUrlAnalyticsTool.name,
    shortUrlAnalyticsTool.description,
    {
      shorturl: z.string().describe('The short URL to get analytics for'),
      period: z.string().optional().describe('The time period for analytics (e.g., "day", "week", "month")')
    },
    shortUrlAnalyticsTool.execute
  );
  
  server.tool(
    contractUrlTool.name,
    contractUrlTool.description,
    {
      url: z.string().describe('The URL to check if it exists in the database')
    },
    contractUrlTool.execute
  );
  
  server.tool(
    updateUrlTool.name,
    updateUrlTool.description,
    {
      shorturl: z.string().describe('The short URL or keyword to update'),
      url: z.string().describe('The new destination URL'),
      title: z.string().optional().describe('Optional new title for the URL')
    },
    updateUrlTool.execute
  );
  
  server.tool(
    changeKeywordTool.name,
    changeKeywordTool.description,
    {
      oldshorturl: z.string().describe('The existing short URL or keyword'),
      newshorturl: z.string().describe('The new keyword to use'),
      title: z.string().optional().describe('Optional new title')
    },
    changeKeywordTool.execute
  );
  
  server.tool(
    getUrlKeywordTool.name,
    getUrlKeywordTool.description,
    {
      url: z.string().describe('The URL to find keywords for'),
      exactly_one: z.boolean().optional().describe('Whether to return only one result (default: false)')
    },
    getUrlKeywordTool.execute
  );
  
  server.tool(
    deleteUrlTool.name,
    deleteUrlTool.description,
    {
      shorturl: z.string().describe('The short URL or keyword to delete')
    },
    deleteUrlTool.execute
  );
  
  server.tool(
    listUrlsTool.name,
    listUrlsTool.description,
    {
      sortby: z.string().optional().describe('Field to sort by (e.g., "clicks", "timestamp")'),
      sortorder: z.string().optional().describe('Sort order ("asc" or "desc")'),
      perpage: z.number().optional().describe('Number of results per page'),
      page: z.number().optional().describe('Page number'),
      search: z.string().optional().describe('Search term to filter results')
    },
    listUrlsTool.execute
  );
  
  server.tool(
    generateQrCodeTool.name,
    generateQrCodeTool.description,
    {
      shorturl: z.string().describe('The short URL to generate a QR code for'),
      size: z.number().optional().describe('Size of the QR code in pixels'),
      format: z.string().optional().describe('Image format (png, svg, etc.)'),
      margin: z.number().optional().describe('Margin size')
    },
    generateQrCodeTool.execute
  );
  
  server.tool(
    customUrlTool.name,
    customUrlTool.description,
    {
      url: z.string().describe('The URL to shorten'),
      keyword: z.string().describe('The custom keyword for the short URL'),
      title: z.string().optional().describe('Optional title for the URL'),
      force_url_modification: z.boolean().optional().describe('Whether to force URL modification to allow duplicates')
    },
    customUrlTool.execute
  );
  
  // Register Google Analytics integration tool
  const shortenWithAnalyticsTool = createShortenWithAnalyticsTool(yourlsClient);
  server.tool(
    shortenWithAnalyticsTool.name,
    shortenWithAnalyticsTool.description,
    {
      url: z.string().describe('The URL to shorten'),
      keyword: z.string().optional().describe('Optional custom keyword for the short URL'),
      title: z.string().optional().describe('Optional title for the URL'),
      utm_source: z.string().describe('UTM source parameter'),
      utm_medium: z.string().describe('UTM medium parameter'),
      utm_campaign: z.string().optional().describe('UTM campaign parameter'),
      utm_term: z.string().optional().describe('UTM term parameter'),
      utm_content: z.string().optional().describe('UTM content parameter')
    },
    shortenWithAnalyticsTool.execute
  );
}