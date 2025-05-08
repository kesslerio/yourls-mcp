/**
 * URL Shortening tool implementation
 */
import { isShortShortError, createShortShortErrorResponse, createMcpResponse } from '../utils.js';

/**
 * Create a URL shortening tool
 * 
 * @param {object} yourlsClient - YOURLS API client
 * @returns {object} Tool definition
 */
export default function createShortenUrlTool(yourlsClient) {
  return {
    name: 'shorten_url',
    description: 'Shorten a long URL using YOURLS',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The URL to shorten'
        },
        keyword: {
          type: 'string',
          description: 'Optional custom keyword for the short URL'
        },
        title: {
          type: 'string',
          description: 'Optional title for the URL'
        }
      },
      required: ['url']
    },
    execute: async ({ url, keyword, title }) => {
      try {
        const result = await yourlsClient.shorten(url, keyword, title);
        
        if (result.shorturl) {
          return createMcpResponse(true, {
            shorturl: result.shorturl,
            url: result.url || url,
            title: result.title || title || ''
          });
        } else {
          return createMcpResponse(false, {
            message: result.message || 'Unknown error',
            code: result.code || 'unknown'
          });
        }
      } catch (error) {
        // Check if this is a ShortShort plugin error (prevents shortening of already-shortened URLs)
        if (isShortShortError(error)) {
          return createMcpResponse(false, createShortShortErrorResponse(url, keyword));
        }
        
        // Handle all other errors
        return createMcpResponse(false, {
          message: error.message,
          code: error.response?.data?.code || 'unknown_error'
        });
      }
    }
  };
}