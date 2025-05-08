/**
 * YOURLS-MCP Tool: Get a list of URLs with sorting, pagination, and filtering options
 */
import { z } from 'zod';

/**
 * Creates the list URLs tool
 * 
 * @param {object} yourlsClient - YOURLS API client instance
 * @returns {object} MCP tool definition
 */
export default function createListUrlsTool(yourlsClient) {
  return {
    name: 'list_urls',
    description: 'Get a list of URLs with sorting, pagination, and filtering options',
    inputSchema: {
      type: 'object',
      properties: {
        sortby: {
          type: 'string',
          description: 'Field to sort by (keyword, url, title, ip, timestamp, clicks)'
        },
        sortorder: {
          type: 'string',
          description: 'Sort order (ASC or DESC)'
        },
        offset: {
          type: 'number',
          description: 'Pagination offset'
        },
        perpage: {
          type: 'number',
          description: 'Number of results per page'
        },
        query: {
          type: 'string',
          description: 'Optional search query for filtering by keyword'
        },
        fields: {
          type: 'array',
          items: {
            type: 'string'
          },
          description: 'Fields to return (keyword, url, title, timestamp, ip, clicks)'
        }
      }
    },
    execute: async ({ sortby, sortorder, offset, perpage, query, fields }) => {
      try {
        const result = await yourlsClient.listUrls({
          sortby,
          sortorder,
          offset,
          perpage,
          query,
          fields
        });
        
        if (result.message === 'success') {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'success',
                  total: result.total,
                  offset: result.offset,
                  perpage: result.perpage,
                  results: result.result || []
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
                message: error.message
              })
            }
          ],
          isError: true
        };
      }
    }
  };
}