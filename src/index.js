/**
 * YOURLS-MCP: Main entry point
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { loadConfig, validateConfig } from './config.js';
import YourlsClient from './api.js';
import { 
  validateUrl, 
  validateUtmParameters, 
  isShortShortError, 
  createShortShortErrorResponse, 
  createMcpResponse 
} from './utils.js';

// Import tool creators - will register from here not from tools/index.js
import createShortenUrlTool from './tools/shortenUrl.js';
import createExpandUrlTool from './tools/expandUrl.js';
import createUrlStatsTool from './tools/urlStats.js';
import createDbStatsTool from './tools/dbStats.js';
import createShortUrlAnalyticsTool from './tools/shortUrlAnalytics.js';
import createContractUrlTool from './tools/contractUrl.js';
import createUpdateUrlTool from './tools/updateUrl.js';
import createChangeKeywordTool from './tools/changeKeyword.js';
import createGetUrlKeywordTool from './tools/getUrlKeyword.js';
import createDeleteUrlTool from './tools/deleteUrl.js';
import createListUrlsTool from './tools/listUrls.js';
import createGenerateQrCodeTool from './tools/generateQrCode.js';
import createShortenWithAnalyticsTool from './tools/shortenWithAnalytics.js';
import createCustomUrlTool from './tools/createCustomUrl.js';

/**
 * Create and configure MCP server for YOURLS
 * 
 * @returns {object} Configured MCP server
 */
export function createServer() {
  // Load and validate configuration
  const config = loadConfig();
  validateConfig(config);

  // Create YOURLS client
  const yourlsClient = new YourlsClient(config.yourls);
  
  // Create the MCP server
  const server = new McpServer({
    name: 'yourls-mcp',
    version: '0.1.0',
  });

  // Create tool instances
  const shortenUrlTool = createShortenUrlTool(yourlsClient);
  const expandUrlTool = createExpandUrlTool(yourlsClient);
  const urlStatsTool = createUrlStatsTool(yourlsClient);
  const dbStatsTool = createDbStatsTool(yourlsClient);
  const shortUrlAnalyticsTool = createShortUrlAnalyticsTool(yourlsClient);
  const contractUrlTool = createContractUrlTool(yourlsClient);
  const updateUrlTool = createUpdateUrlTool(yourlsClient);
  const changeKeywordTool = createChangeKeywordTool(yourlsClient);
  const getUrlKeywordTool = createGetUrlKeywordTool(yourlsClient);
  const deleteUrlTool = createDeleteUrlTool(yourlsClient);
  const listUrlsTool = createListUrlsTool(yourlsClient);
  const generateQrCodeTool = createGenerateQrCodeTool(yourlsClient);
  const customUrlTool = createCustomUrlTool(yourlsClient);
  const shortenWithAnalyticsTool = createShortenWithAnalyticsTool(yourlsClient);

  // Register core tools
  server.tool(
    shortenUrlTool.name,
    shortenUrlTool.description,
    {
      url: z.string().describe('The URL to shorten'),
      keyword: z.string().optional().describe('Optional custom keyword for the short URL'),
      title: z.string().optional().describe('Optional title for the URL')
    },
    async ({ url, keyword, title }) => {
      try {
        const result = await yourlsClient.shorten(url, keyword, title);
        
        if (result.shorturl) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'success',
                  shorturl: result.shorturl,
                  url: result.url || url,
                  title: result.title || title || ''
                })
              }
            ]
          };
        } else {
          throw new Error(result.message || 'Unknown error');
        }
      } catch (error) {
        // Check if this is a ShortShort plugin error
        if (isShortShortError(error)) {
          return createMcpResponse(false, createShortShortErrorResponse(url, keyword));
        }
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'error',
                message: error.message,
                code: error.response?.data?.code || 'unknown_error'
              })
            }
          ],
          isError: true
        };
      }
    }
  );
  
  server.tool(
    expandUrlTool.name,
    expandUrlTool.description,
    {
      shorturl: z.string().describe('The short URL or keyword to expand')
    },
    async ({ shorturl }) => {
      try {
        const result = await yourlsClient.expand(shorturl);
        
        if (result.longurl) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'success',
                  shorturl: result.shorturl || shorturl,
                  longurl: result.longurl,
                  title: result.title || ''
                })
              }
            ]
          };
        } else {
          throw new Error(result.message || 'Unknown error');
        }
      } catch (error) {
        // Check if it's a 404 error (short URL not found)
        if (error.response && error.response.status === 404) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'error',
                  message: `The short URL or keyword '${shorturl}' was not found in the database.`,
                  code: 'not_found'
                })
              }
            ],
            isError: true
          };
        }
        
        // For other errors, provide better formatting
        let errorMessage = error.message;
        if (error.response && error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'error',
                message: errorMessage,
                shorturl: shorturl
              })
            }
          ],
          isError: true
        };
      }
    }
  );
  
  server.tool(
    urlStatsTool.name,
    urlStatsTool.description,
    {
      shorturl: z.string().describe('The short URL or keyword to get stats for')
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
    async ({ url, keyword, title, force_url_modification }) => {
      try {
        // Use the enhanced createCustomUrl method that handles duplicate URLs
        const result = await yourlsClient.createCustomUrl(url, keyword, title, force_url_modification);
        
        // Handle the regular success case with a shorturl
        if (result.shorturl) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'success',
                  shorturl: result.shorturl,
                  url: result.url || url,
                  keyword: keyword,
                  title: result.title || title || '',
                  message: result.message || 'Short URL created successfully'
                })
              }
            ]
          };
        } 
        // Handle the case where URL already exists with a different keyword
        else if (result.status === 'success' && result.existingShorturl) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'success',
                  message: `URL already exists with the keyword '${result.existingKeyword}' instead of '${keyword}'`,
                  existingShorturl: result.existingShorturl,
                  existingKeyword: result.existingKeyword,
                  requestedKeyword: keyword,
                  url: url
                })
              }
            ]
          };
        }
        // Handle error cases
        else if (result.status === 'fail' && result.code === 'error:keyword') {
          // Handle case where keyword already exists
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'error',
                  message: `The keyword '${keyword}' is already in use. Please choose another keyword.`,
                  code: 'keyword_exists'
                })
              }
            ],
            isError: true
          };
        } else {
          throw new Error(result.message || 'Unknown error');
        }
      } catch (error) {
        // Check for specific error messages about keyword conflicts
        if (error.message && error.message.includes('already exists and points to a different URL')) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'error',
                  message: error.message,
                  code: 'keyword_conflict',
                  url: url,
                  keyword: keyword
                })
              }
            ],
            isError: true
          };
        }
        
        // Check if this is a ShortShort plugin error (prevents shortening of already-shortened URLs)
        if (isShortShortError(error)) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(createShortShortErrorResponse(url, keyword))
              }
            ],
            isError: true
          };
        }
        
        // Provide a more helpful error message for other errors
        let errorMessage = error.message;
        
        // If the error contains response data with a message, use that
        if (error.response && error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'error',
                message: errorMessage,
                code: error.response?.data?.code || 'unknown_error',
                originalUrl: url,
                attemptedKeyword: keyword
              })
            }
          ],
          isError: true
        };
      }
    }
  );
  
  // Register Google Analytics integration tool
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

  // Create a wrapper to maintain the original API
  return {
    listen() {
      process.stderr.write('YOURLS-MCP server starting...\n');
      
      // Create a StdioServerTransport
      const transport = new StdioServerTransport();
      
      // Connect the transport to the server
      server.connect(transport)
        .then(() => {
          process.stderr.write('YOURLS-MCP server connected\n');
          
          // Keep the process running
          setInterval(() => {}, 1000);
        })
        .catch((error) => {
          process.stderr.write(`Error connecting YOURLS-MCP server: ${error.message}\n`);
          process.exit(1);
        });
    }
  };
}