/**
 * YOURLS-MCP Tool: Change the keyword of an existing short URL
 */
import { z } from 'zod';
import { createMcpResponse } from '../utils.js';

/**
 * Creates the change keyword tool
 * 
 * @param {object} yourlsClient - YOURLS API client instance
 * @returns {object} MCP tool definition
 */
export default function createChangeKeywordTool(yourlsClient) {
  return {
    name: 'change_keyword',
    description: 'Change the keyword of an existing short URL',
    inputSchema: {
      type: 'object',
      properties: {
        oldshorturl: {
          type: 'string',
          description: 'The existing short URL or keyword'
        },
        newshorturl: {
          type: 'string',
          description: 'The new keyword to use'
        },
        url: {
          type: 'string',
          description: 'Optional URL (if not provided, will use the URL from oldshorturl)'
        },
        title: {
          type: 'string',
          description: 'Optional new title ("keep" to keep existing, "auto" to fetch from URL)'
        }
      },
      required: ['oldshorturl', 'newshorturl']
    },
    execute: async ({ oldshorturl, newshorturl, url, title }) => {
      try {
        // Use the changeKeyword method with fallback enabled
        const result = await yourlsClient.changeKeyword(oldshorturl, newshorturl, url, title, true);
        
        if (result.status === 'success' || result.message === 'success: updated' || result.statusCode === 200) {
          const responseData = {
            message: result.message || result.simple || `Keyword changed from '${oldshorturl}' to '${newshorturl}'`,
            oldshorturl: oldshorturl,
            newshorturl: newshorturl,
            shorturl: result.shorturl
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
          oldshorturl: oldshorturl,
          newshorturl: newshorturl
        });
      }
    }
  };
}