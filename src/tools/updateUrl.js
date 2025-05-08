/**
 * YOURLS-MCP Tool: Update a short URL to point to a different destination
 */
import { z } from 'zod';
import { createMcpResponse } from '../utils.js';

/**
 * Creates the update URL tool
 * 
 * @param {object} yourlsClient - YOURLS API client instance
 * @returns {object} MCP tool definition
 */
export default function createUpdateUrlTool(yourlsClient) {
  return {
    name: 'update_url',
    description: 'Update an existing short URL to point to a different destination URL',
    inputSchema: {
      type: 'object',
      properties: {
        shorturl: {
          type: 'string',
          description: 'The short URL or keyword to update'
        },
        url: {
          type: 'string',
          description: 'The new destination URL'
        },
        title: {
          type: 'string',
          description: 'Optional new title ("keep" to keep existing, "auto" to fetch from URL)'
        }
      },
      required: ['shorturl', 'url']
    },
    execute: async ({ shorturl, url, title }) => {
      try {
        // Use the updateUrl method with fallback enabled
        const result = await yourlsClient.updateUrl(shorturl, url, title, true);
        
        // Check for both plugin success message and fallback success messages
        if (result.status === 'success' || result.message === 'success: updated') {
          const responseData = {
            shorturl: result.shorturl || shorturl,
            url: url,
            message: result.message || 'Short URL updated successfully'
          };
          
          // Add fallback information if applicable
          if (result.fallback_used) {
            responseData.fallback_used = true;
            if (result.fallback_limited) {
              responseData.fallback_limited = true;
            }
            if (result.fallback_limitations) {
              responseData.fallback_limitations = result.fallback_limitations;
            }
          }
          
          return createMcpResponse(true, responseData);
        } else {
          throw new Error(result.message || 'Unknown error');
        }
      } catch (error) {
        return createMcpResponse(false, {
          message: error.message,
          shorturl: shorturl,
          url: url
        });
      }
    }
  };
}