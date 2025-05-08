/**
 * YOURLS-MCP: Main entry point
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { loadConfig, validateConfig } from './config.js';
import YourlsClient from './api.js';

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
                  keyword: keyword,
                  title: result.title || title || ''
                })
              }
            ]
          };
        } else if (result.status === 'fail' && result.code === 'error:keyword') {
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