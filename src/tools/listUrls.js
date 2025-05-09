/**
 * YOURLS-MCP Tool: Get a list of URLs with sorting, pagination, and filtering options
 */
import { z } from 'zod';
import { createMcpResponse } from '../utils.js';

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
        // Validate sortby
        const validSortFields = ['keyword', 'url', 'title', 'ip', 'timestamp', 'clicks'];
        if (sortby && !validSortFields.includes(sortby)) {
          throw new Error(`Invalid sortby value. Must be one of: ${validSortFields.join(', ')}`);
        }
        
        // Validate sortorder
        if (sortorder && !['ASC', 'DESC', 'asc', 'desc'].includes(sortorder)) {
          throw new Error('Invalid sortorder value. Must be ASC or DESC');
        }
        
        // Validate numeric parameters
        if (offset !== undefined && (isNaN(Number(offset)) || Number(offset) < 0)) {
          throw new Error('Offset must be a non-negative number');
        }
        
        if (perpage !== undefined && (isNaN(Number(perpage)) || Number(perpage) <= 0)) {
          throw new Error('Perpage must be a positive number');
        }
        
        // Normalize fields if needed
        let normalizedFields = fields;
        if (typeof fields === 'string') {
          try {
            normalizedFields = JSON.parse(fields);
          } catch (e) {
            normalizedFields = fields.split(',').map(f => f.trim());
          }
        }
        
        // Use the listUrls method with fallback enabled
        const result = await yourlsClient.listUrls({
          sortby,
          sortorder,
          offset: offset !== undefined ? Number(offset) : undefined,
          perpage: perpage !== undefined ? Number(perpage) : undefined,
          query,
          fields: normalizedFields,
          useNativeFallback: true
        });
        
        if (result.status === 'success') {
          const responseData = {
            total: result.total,
            page: result.page || 1,
            perpage: result.perpage,
            links: result.links || {},
            results: result.result || []
          };
          
          // Add fallback information if applicable
          if (result.fallback_used) {
            responseData.fallback_used = true;
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
          message: error.message
        });
      }
    }
  };
}