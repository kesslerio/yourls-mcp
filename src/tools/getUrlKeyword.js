/**
 * YOURLS-MCP Tool: Get the keyword(s) for a long URL
 */
import { z } from 'zod';
import { createMcpResponse } from '../utils.js';

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
        // Normalize boolean parameter if it's passed as a string
        if (typeof exactly_one === 'string') {
          exactly_one = exactly_one.toLowerCase() === 'true';
        }
        
        // Use the getUrlKeyword method with fallback enabled
        const result = await yourlsClient.getUrlKeyword(url, exactly_one, true);
        
        if (result.status === 'success' || result.message === 'success: found') {
          const responseData = {
            url: url
          };
          
          // Add keyword information based on response format
          if (exactly_one && result.keyword) {
            responseData.keyword = result.keyword;
            if (result.shorturl) responseData.shorturl = result.shorturl;
            if (result.title) responseData.title = result.title;
          } else if (!exactly_one && result.keywords) {
            responseData.keywords = result.keywords;
          }
          
          // Add message if available
          if (result.simple) responseData.message = result.simple;
          
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