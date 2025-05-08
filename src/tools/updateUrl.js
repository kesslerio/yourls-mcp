/**
 * YOURLS-MCP Tool: Update a short URL to point to a different destination
 */
import { z } from 'zod';

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
        const result = await yourlsClient.updateUrl(shorturl, url, title);
        
        if (result.message === 'success: updated') {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'success',
                  shorturl: shorturl,
                  url: url,
                  message: result.simple || 'Short URL updated successfully'
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
                shorturl: shorturl,
                url: url
              })
            }
          ],
          isError: true
        };
      }
    }
  };
}