/**
 * YOURLS-MCP Tool: Check if a URL has been shortened
 */
import { z } from 'zod';

/**
 * Creates the contract URL tool
 * 
 * @param {object} yourlsClient - YOURLS API client instance
 * @returns {object} MCP tool definition
 */
export default function createContractUrlTool(yourlsClient) {
  return {
    name: 'contract_url',
    description: 'Check if a URL has already been shortened without creating a new short URL',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The URL to check if it has been shortened'
        }
      },
      required: ['url']
    },
    execute: async ({ url }) => {
      try {
        const result = await yourlsClient.contractUrl(url);
        
        if (result.message === 'success') {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'success',
                  url: url,
                  exists: result.url_exists,
                  links: result.links || []
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