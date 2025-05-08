/**
 * YOURLS-MCP Tool: Delete a short URL
 */
import { z } from 'zod';
import { createMcpResponse } from '../utils.js';

/**
 * Creates the delete URL tool
 * 
 * @param {object} yourlsClient - YOURLS API client instance
 * @returns {object} MCP tool definition
 */
export default function createDeleteUrlTool(yourlsClient) {
  return {
    name: 'delete_url',
    description: 'Delete a short URL',
    inputSchema: {
      type: 'object',
      properties: {
        shorturl: {
          type: 'string',
          description: 'The short URL or keyword to delete'
        }
      },
      required: ['shorturl']
    },
    execute: async ({ shorturl }) => {
      try {
        // Use the deleteUrl method with fallback enabled
        const result = await yourlsClient.deleteUrl(shorturl, true);
        
        if (result.status === 'success' || result.message === 'success: deleted') {
          const responseData = {
            shorturl: shorturl,
            message: result.message || result.simple || 'Short URL deleted successfully'
          };
          
          // Add fallback information if applicable
          if (result.fallback_used) {
            responseData.fallback_used = true;
            if (result.fallback_limited) {
              responseData.fallback_limited = true;
              
              // Special handling for the limited delete fallback
              if (result.status === 'info') {
                return {
                  content: [
                    {
                      type: 'text',
                      text: JSON.stringify({
                        status: 'info',
                        shorturl: shorturl,
                        message: result.message,
                        code: result.code || 'not_supported',
                        fallback_used: true,
                        fallback_limited: true
                      })
                    }
                  ]
                };
              }
            }
          }
          
          return createMcpResponse(true, responseData);
        } else if (result.status === 'info') {
          // Special handling for the info status (fallback limitation)
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'info',
                  shorturl: shorturl,
                  message: result.message,
                  fallback_used: result.fallback_used,
                  fallback_limited: result.fallback_limited
                })
              }
            ]
          };
        } else {
          throw new Error(result.message || 'Unknown error');
        }
      } catch (error) {
        return createMcpResponse(false, {
          message: error.message,
          shorturl: shorturl
        });
      }
    }
  };
}