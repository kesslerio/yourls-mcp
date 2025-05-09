/**
 * URL Expansion tool implementation
 * 
 * Uses the standardized MCP response format via createMcpResponse utility:
 * - Success: {content: [{type: 'text', text: JSON.stringify({status: 'success', ...data})}]}
 * - Error: {content: [{type: 'text', text: JSON.stringify({status: 'error', ...data})}], isError: true}
 */
import { createMcpResponse } from '../utils.js';

/**
 * Create a URL expansion tool
 * 
 * @param {object} yourlsClient - YOURLS API client
 * @returns {object} Tool definition with standardized MCP response format
 */
export default function createExpandUrlTool(yourlsClient) {
  return {
    name: 'expand_url',
    description: 'Expand a short URL to its original long URL',
    inputSchema: {
      type: 'object',
      properties: {
        shorturl: {
          type: 'string',
          description: 'The short URL or keyword to expand'
        }
      },
      required: ['shorturl']
    },
    execute: async ({ shorturl }) => {
      try {
        const result = await yourlsClient.expand(shorturl);
        
        if (result.longurl) {
          return createMcpResponse(true, {
            shorturl: result.shorturl || shorturl,
            longurl: result.longurl,
            title: result.title || ''
          });
        } else {
          return createMcpResponse(false, {
            message: result.message || 'Unknown error',
            code: result.code || 'unknown'
          });
        }
      } catch (error) {
        return createMcpResponse(false, {
          message: error.message
        });
      }
    }
  };
}