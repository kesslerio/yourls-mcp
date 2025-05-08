/**
 * YOURLS-MCP Tool: Check if a URL has been shortened
 */
import { z } from 'zod';
import { createMcpResponse } from '../utils.js';

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
        // Use the contractUrl method with fallback enabled
        const result = await yourlsClient.contractUrl(url, true);
        
        if (result.message === 'success') {
          const responseData = {
            url: url,
            exists: result.url_exists,
            links: result.links || []
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
          message: error.message,
          url: url
        });
      }
    }
  };
}