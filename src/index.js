/**
 * YOURLS-MCP: Main entry point
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { loadConfig, validateConfig } from './config.js';
import YourlsClient from './api.js';
import { registerTools } from './tools/index.js';
import { 
  validateUrl, 
  validateUtmParameters, 
  isShortShortError, 
  createShortShortErrorResponse, 
  createMcpResponse 
} from './utils.js';

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

  // Register shorten_url tool
  server.tool('shorten_url', 
    'Shorten a long URL using YOURLS', 
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
        return {
          content: [
            {
              type: 'text',
              text: error.message
            }
          ],
          isError: true
        };
      }
    }
  );

  // Register expand_url tool
  server.tool('expand_url', 
    'Expand a short URL to its original long URL', 
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

  // Register url_stats tool
  server.tool('url_stats', 
    'Get statistics for a shortened URL', 
    {
      shorturl: z.string().describe('The short URL or keyword to get stats for')
    },
    async ({ shorturl }) => {
      try {
        const result = await yourlsClient.urlStats(shorturl);
        
        if (result.link) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'success',
                  shorturl: result.shorturl || shorturl,
                  clicks: result.link.clicks || 0,
                  title: result.link.title || '',
                  longurl: result.link.url || ''
                })
              }
            ]
          };
        } else {
          throw new Error(result.message || 'Unknown error');
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: error.message
            }
          ],
          isError: true
        };
      }
    }
  );

  // Register db_stats tool
  server.tool('db_stats', 
    'Get global statistics for the YOURLS instance', 
    {},
    async () => {
      try {
        const result = await yourlsClient.dbStats();
        
        if (result['db-stats']) {
          const stats = result['db-stats'];
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'success',
                  total_links: stats.total_links || 0,
                  total_clicks: stats.total_clicks || 0
                })
              }
            ]
          };
        } else {
          throw new Error(result.message || 'Unknown error');
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: error.message
            }
          ],
          isError: true
        };
      }
    }
  );

  // Register create_custom_url tool
  server.tool('create_custom_url', 
    'Create a custom short URL with a specific keyword', 
    {
      url: z.string().describe('The target URL to shorten'),
      keyword: z.string().describe('The custom keyword for the short URL (e.g., "web" for bysha.pe/web)'),
      title: z.string().optional().describe('Optional title for the URL')
    },
    async ({ url, keyword, title }) => {
      try {
        // Use the enhanced createCustomUrl method that handles duplicate URLs
        const result = await yourlsClient.createCustomUrl(url, keyword, title);
        
        // Handle the regular success case with a shorturl
        if (result.shorturl) {
          return createMcpResponse(true, {
            shorturl: result.shorturl,
            url: result.url || url,
            keyword: keyword,
            title: result.title || title || '',
            message: result.message || 'Short URL created successfully'
          });
        } 
        // Handle the case where URL already exists with a different keyword
        else if (result.status === 'success' && result.existingShorturl) {
          return createMcpResponse(true, {
            message: `URL already exists with the keyword '${result.existingKeyword}' instead of '${keyword}'`,
            existingShorturl: result.existingShorturl,
            existingKeyword: result.existingKeyword,
            requestedKeyword: keyword,
            url: url
          });
        }
        // Handle error cases
        else if (result.status === 'fail' && result.code === 'error:keyword') {
          // Handle case where keyword already exists
          return createMcpResponse(false, {
            message: `The keyword '${keyword}' is already in use. Please choose another keyword.`,
            code: 'keyword_exists'
          });
        } else {
          throw new Error(result.message || 'Unknown error');
        }
      } catch (error) {
        // Check for specific error messages about keyword conflicts
        if (error.message && error.message.includes('already exists and points to a different URL')) {
          return createMcpResponse(false, {
            message: error.message,
            code: 'keyword_conflict',
            url: url,
            keyword: keyword
          });
        }
        
        // Check if this is a ShortShort plugin error (prevents shortening of already-shortened URLs)
        if (isShortShortError(error)) {
          return createMcpResponse(false, createShortShortErrorResponse(url, keyword));
        }
        
        // Provide a more helpful error message for other errors
        let errorMessage = error.message;
        
        // If the error contains response data with a message, use that
        if (error.response && error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
        
        return createMcpResponse(false, {
          message: errorMessage,
          code: error.response?.data?.code || 'unknown_error',
          originalUrl: url,
          attemptedKeyword: keyword
        });
      }
    }
  );

  // Register all tools using the centralized tool registration
  registerTools(server, yourlsClient);

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