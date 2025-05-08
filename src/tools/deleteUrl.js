/**
 * YOURLS-MCP Tool: Delete a short URL
 */
import { z } from 'zod';

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
        const result = await yourlsClient.deleteUrl(shorturl);
        
        if (result.message === 'success: deleted') {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'success',
                  shorturl: shorturl,
                  message: result.simple || 'Short URL deleted successfully'
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
                shorturl: shorturl
              })
            }
          ],
          isError: true
        };
      }
    }
  };
}