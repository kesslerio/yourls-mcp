/**
 * URL Statistics tool implementation
 */
import { createMcpResponse } from '../utils.js';

/**
 * Create a URL statistics tool
 * 
 * @param {object} yourlsClient - YOURLS API client
 * @returns {object} Tool definition
 */
export default function createUrlStatsTool(yourlsClient) {
  return {
    name: 'url_stats',
    description: 'Get statistics for a shortened URL',
    inputSchema: {
      type: 'object',
      properties: {
        shorturl: {
          type: 'string',
          description: 'The short URL or keyword to get stats for'
        }
      },
      required: ['shorturl']
    },
    execute: async ({ shorturl }) => {
      try {
        const result = await yourlsClient.urlStats(shorturl);
        
        if (result.link) {
          return createMcpResponse(true, {
            shorturl: result.shorturl || shorturl,
            clicks: result.link.clicks || 0,
            title: result.link.title || '',
            longurl: result.link.url || ''
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