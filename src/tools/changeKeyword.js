/**
 * YOURLS-MCP Tool: Change the keyword of an existing short URL
 */
import { z } from 'zod';

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
        const result = await yourlsClient.changeKeyword(oldshorturl, newshorturl, url, title);
        
        if (result.message === 'success: updated') {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'success',
                  oldshorturl: oldshorturl,
                  newshorturl: newshorturl,
                  message: result.simple || 'Keyword changed successfully'
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
              text: JSON.stringify({
                status: 'error',
                message: error.message,
                oldshorturl: oldshorturl,
                newshorturl: newshorturl
              })
            }
          ],
          isError: true
        };
      }
    }
  };
}