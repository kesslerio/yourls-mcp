/**
 * YOURLS-MCP: Main entry point
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { loadConfig, validateConfig, parseAllowedTools } from './config.js';
import YourlsClient from './api.js';
import { 
  isShortShortError, 
  createShortShortErrorResponse, 
  createMcpResponse 
} from './utils.js';
import { loadBearerTokens } from './bearer.js';
import { startHttpServer } from './http.js';

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
 * Build the full list of tool registrations for the MCP server.
 * Each entry maps to one server.tool(name, description, paramsSchema, handler) call.
 *
 * @param {object} yourlsClient - YOURLS API client
 * @returns {Array<{name: string, description: string, params: object, handler: Function}>}
 */
export function getToolRegistrations(yourlsClient) {
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

  return [
    {
      name: shortenUrlTool.name,
      description: shortenUrlTool.description,
      params: {
        url: z.string().describe('The URL to shorten'),
        keyword: z.string().optional().describe('Optional custom keyword for the short URL (kebab-case business-name slug, e.g. "acme-corp-monthly")'),
        title: z.string().optional().describe('Optional title for the URL')
      },
      handler: shortenUrlTool.execute
    },
    {
      name: expandUrlTool.name,
      description: expandUrlTool.description,
      params: {
        shorturl: z.string().describe('The short URL or keyword to expand')
      },
      handler: async ({ shorturl }) => {
        try {
          const result = await yourlsClient.expand(shorturl);
          
          if (result.longurl) {
            return createMcpResponse(true, {
              shorturl: result.shorturl || shorturl,
              longurl: result.longurl,
              title: result.title || ''
            });
          } else {
            throw new Error(result.message || 'Unknown error');
          }
        } catch (error) {
          // Check if it's a 404 error (short URL not found)
          if (error.response && error.response.status === 404) {
            return createMcpResponse(false, {
              message: `The short URL or keyword '${shorturl}' was not found in the database.`,
              code: 'not_found'
            });
          }
          
          // For other errors, provide better formatting
          let errorMessage = error.message;
          if (error.response && error.response.data && error.response.data.message) {
            errorMessage = error.response.data.message;
          }
          
          return createMcpResponse(false, {
            message: errorMessage,
            shorturl: shorturl
          });
        }
      }
    },
    {
      name: urlStatsTool.name,
      description: urlStatsTool.description,
      params: {
        shorturl: z.string().describe('The short URL or keyword to get stats for')
      },
      handler: urlStatsTool.execute
    },
    {
      name: dbStatsTool.name,
      description: dbStatsTool.description,
      params: {},
      handler: dbStatsTool.execute
    },
    {
      name: shortUrlAnalyticsTool.name,
      description: shortUrlAnalyticsTool.description,
      params: {
        shorturl: z.string().describe('The short URL to get analytics for'),
        period: z.string().optional().describe('The time period for analytics (e.g., "day", "week", "month")')
      },
      handler: shortUrlAnalyticsTool.execute
    },
    {
      name: contractUrlTool.name,
      description: contractUrlTool.description,
      params: {
        url: z.string().describe('The URL to check if it exists in the database')
      },
      handler: contractUrlTool.execute
    },
    {
      name: updateUrlTool.name,
      description: updateUrlTool.description,
      params: {
        shorturl: z.string().describe('The short URL or keyword to update'),
        url: z.string().describe('The new destination URL'),
        title: z.string().optional().describe('Optional new title for the URL')
      },
      handler: updateUrlTool.execute
    },
    {
      name: changeKeywordTool.name,
      description: changeKeywordTool.description,
      params: {
        oldshorturl: z.string().describe('The existing short URL or keyword'),
        newshorturl: z.string().describe('The new keyword to use'),
        title: z.string().optional().describe('Optional new title')
      },
      handler: changeKeywordTool.execute
    },
    {
      name: getUrlKeywordTool.name,
      description: getUrlKeywordTool.description,
      params: {
        url: z.string().describe('The URL to find keywords for'),
        exactly_one: z.boolean().optional().describe('Whether to return only one result (default: false)')
      },
      handler: getUrlKeywordTool.execute
    },
    {
      name: deleteUrlTool.name,
      description: deleteUrlTool.description,
      params: {
        shorturl: z.string().describe('The short URL or keyword to delete')
      },
      handler: deleteUrlTool.execute
    },
    {
      name: listUrlsTool.name,
      description: listUrlsTool.description,
      params: {
        sortby: z.string().optional().describe('Field to sort by (e.g., "clicks", "timestamp")'),
        sortorder: z.string().optional().describe('Sort order ("asc" or "desc")'),
        perpage: z.number().optional().describe('Number of results per page'),
        page: z.number().optional().describe('Page number'),
        search: z.string().optional().describe('Search term to filter results')
      },
      handler: listUrlsTool.execute
    },
    {
      name: generateQrCodeTool.name,
      description: generateQrCodeTool.description,
      params: {
        shorturl: z.string().describe('The short URL to generate a QR code for'),
        size: z.number().optional().describe('Size of the QR code in pixels'),
        format: z.string().optional().describe('Image format (png, svg, etc.)'),
        margin: z.number().optional().describe('Margin size')
      },
      handler: generateQrCodeTool.execute
    },
    {
      name: customUrlTool.name,
      description: customUrlTool.description,
      params: {
        url: z.string().describe('The URL to shorten'),
        keyword: z.string().describe('The custom keyword for the short URL'),
        title: z.string().optional().describe('Optional title for the URL'),
        force_url_modification: z.boolean().optional().describe('Whether to force URL modification to allow duplicates')
      },
      handler: async ({ url, keyword, title, force_url_modification }) => {
        try {
          // Use the enhanced createCustomUrl method that handles duplicate URLs
          const result = await yourlsClient.createCustomUrl(url, keyword, title, force_url_modification);
          
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
    },
    {
      name: shortenWithAnalyticsTool.name,
      description: shortenWithAnalyticsTool.description,
      params: {
        url: z.string().describe('The URL to shorten'),
        keyword: z.string().optional().describe('Optional custom keyword for the short URL'),
        title: z.string().optional().describe('Optional title for the URL'),
        utm_source: z.string().describe('UTM source parameter'),
        utm_medium: z.string().describe('UTM medium parameter'),
        utm_campaign: z.string().optional().describe('UTM campaign parameter'),
        utm_term: z.string().optional().describe('UTM term parameter'),
        utm_content: z.string().optional().describe('UTM content parameter')
      },
      handler: shortenWithAnalyticsTool.execute
    }
  ];
}

/**
 * Filter tool registrations down to an allowlist of tool names.
 * A null/undefined allowlist returns every registration unchanged.
 *
 * @param {Array} registrations - Tool registrations from getToolRegistrations()
 * @param {string[]|null} [allowedTools] - Tool names to keep, or null for all tools
 * @returns {Array} Filtered registrations
 */
export function filterToolRegistrations(registrations, allowedTools = null) {
  if (!allowedTools) {
    return registrations;
  }
  const allowed = new Set(allowedTools);
  return registrations.filter(registration => allowed.has(registration.name));
}

/**
 * Build a fresh MCP server instance with the requested tools registered.
 * A new server is created per call so HTTP sessions each get their own.
 *
 * @param {object} yourlsClient - YOURLS API client
 * @param {object} [options]
 * @param {string[]|null} [options.allowedTools] - Tool allowlist; null registers all tools
 * @returns {McpServer} Configured MCP server
 */
export function buildMcpServer(yourlsClient, { allowedTools = null } = {}) {
  // Create the MCP server with capability declarations
  const server = new McpServer({
    name: 'yourls-mcp',
    version: '0.1.0',
  }, {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {}
    }
  });

  const registrations = filterToolRegistrations(
    getToolRegistrations(yourlsClient),
    allowedTools
  );

  for (const registration of registrations) {
    server.tool(registration.name, registration.description, registration.params, registration.handler);
  }

  // The McpServer class automatically handles resources/list and prompts/list
  // with empty responses if we don't explicitly register any resources or prompts

  return server;
}

/**
 * Create and configure the YOURLS-MCP server.
 *
 * @param {object} [options]
 * @param {string} [options.transport='stdio'] - 'stdio' or 'http'
 * @param {number} [options.port=3133] - HTTP listen port (http transport only)
 * @param {string} [options.bind='127.0.0.1'] - HTTP bind address (http transport only)
 * @param {string[]|null} [options.allowedTools] - Tool allowlist; defaults to YOURLS_MCP_ALLOWED_TOOLS, null = all tools
 * @param {string} [options.bearerTokensFile] - Bearer tokens JSON file; defaults to YOURLS_MCP_BEARER_TOKENS_FILE
 * @param {boolean} [options.allowUnauthenticated] - Skip bearer auth; defaults to YOURLS_MCP_ALLOW_UNAUTHENTICATED === '1'
 * @returns {object} Configured server wrapper with listen()
 */
export function createServer({
  transport = 'stdio',
  port = 3133,
  bind = '127.0.0.1',
  allowedTools = parseAllowedTools(process.env.YOURLS_MCP_ALLOWED_TOOLS),
  bearerTokensFile = process.env.YOURLS_MCP_BEARER_TOKENS_FILE,
  allowUnauthenticated = process.env.YOURLS_MCP_ALLOW_UNAUTHENTICATED === '1'
} = {}) {
  // Load and validate configuration
  const config = loadConfig();
  validateConfig(config);

  // Create YOURLS client
  const yourlsClient = new YourlsClient(config.yourls);

  // Warn about allowlist entries that don't match registered tools
  if (allowedTools) {
    const known = new Set(getToolRegistrations(yourlsClient).map(registration => registration.name));
    const unknown = allowedTools.filter(name => !known.has(name));
    if (unknown.length > 0) {
      process.stderr.write(`YOURLS_MCP_ALLOWED_TOOLS: unknown tool names ignored: ${unknown.join(', ')}\n`);
    }
  }

  if (transport === 'http') {
    if (!Number.isInteger(port) || port < 0 || port > 65535) {
      throw new Error(`Invalid HTTP port: ${port}`);
    }

    // Hard startup error: HTTP mode requires bearer tokens unless explicitly allowed
    const tokens = allowUnauthenticated ? null : loadBearerTokens(bearerTokensFile);
    const createMcpServer = () => buildMcpServer(yourlsClient, { allowedTools });

    // Create a wrapper to maintain the original API
    return {
      listen() {
        const { httpServer } = startHttpServer({
          port,
          bind,
          createMcpServer,
          tokens,
          allowUnauthenticated
        });

        httpServer.on('listening', () => {
          process.stderr.write(`YOURLS-MCP HTTP server listening on http://${bind}:${port}/mcp\n`);
        });
        httpServer.on('error', (error) => {
          process.stderr.write(`YOURLS-MCP HTTP server error: ${error.message}\n`);
          process.exit(1);
        });

        return httpServer;
      }
    };
  }

  const server = buildMcpServer(yourlsClient, { allowedTools });

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
