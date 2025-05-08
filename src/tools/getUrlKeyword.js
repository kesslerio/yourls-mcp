/**
 * YOURLS-MCP Tool: Get the keyword(s) for a long URL
 */
import { z } from 'zod';

/**
 * Creates the get URL keyword tool
 * 
 * @param {object} yourlsClient - YOURLS API client instance
 * @returns {object} MCP tool definition
 */
export default function createGetUrlKeywordTool(yourlsClient) {
  return {
    name: 'get_url_keyword',
    description: 'Get the keyword(s) for a long URL',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The long URL to look up'
        },
        exactly_one: {
          type: 'boolean',
          description: 'If false, returns all keywords for this URL (default: true)'
        }
      },
      required: ['url']
    },
    execute: async ({ url, exactly_one = true }) => {
      try {
        const result = await yourlsClient.getUrlKeyword(url, exactly_one);
        
        if (result.message === 'success: found') {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'success',
                  url: url,
                  keyword: result.keyword,
                  message: result.simple || 'Keywords found'
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