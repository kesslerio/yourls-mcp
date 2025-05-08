/**
 * Create custom URL tool
 */
import { z } from 'zod';
import { createMcpResponse } from '../utils.js';

/**
 * Create a tool for creating custom URLs with specific keywords
 * 
 * @param {object} yourlsClient - YOURLS API client
 * @returns {object} Tool definition
 */
export default function createCustomUrlTool(yourlsClient) {
  return {
    name: 'create_custom_url',
    description: 'Create a custom short URL with a specific keyword, even for URLs that already exist in the database',
    
    parameters: {
      url: z.string().describe('The target URL to shorten'),
      keyword: z.string().describe('The custom keyword for the short URL (e.g., "web" for bysha.pe/web)'),
      title: z.string().optional().describe('Optional title for the URL'),
      bypass_shortshort: z.boolean().optional().describe('Whether to bypass the ShortShort plugin that prevents shortening already-shortened URLs (default: false)'),
      force_url_modification: z.boolean().optional().describe('Whether to force using URL modification approach to create multiple short URLs for the same destination (default: false)')
    },
    
    execute: async ({ url, keyword, title, bypass_shortshort = false, force_url_modification = false }) => {
      try {
        // Use the enhanced createCustomUrl method that handles duplicate URLs
        const result = await yourlsClient.createCustomUrl(
          url, 
          keyword, 
          title, 
          bypass_shortshort,
          force_url_modification
        );
        
        // Handle the regular success case with a shorturl
        if (result.shorturl) {
          return createMcpResponse(true, {
            shorturl: result.shorturl,
            url: result.url || url,
            keyword: keyword,
            title: result.title || title || '',
            message: result.message || 'Short URL created successfully',
            display_url: result.display_url,
            internal_url: result.internal_url
          });
        } 
        // Handle the case where URL already exists with a different keyword
        else if (result.status === 'success' && result.existingShorturl) {
          return createMcpResponse(true, {
            message: `URL already exists with the keyword '${result.existingKeyword}' instead of '${keyword}'`,
            existingShorturl: result.existingShorturl,
            existingKeyword: result.existingKeyword,
            requestedKeyword: keyword,
            url: url
          });
        }
        // Handle error cases
        else if (result.status === 'fail' && result.code === 'error:keyword') {
          // Handle case where keyword already exists
          return createMcpResponse(false, {
            message: `The keyword '${keyword}' is already in use. Please choose another keyword.`,
            code: 'keyword_exists'
          });
        } else {
          return createMcpResponse(false, {
            message: result.message || 'Unknown error',
            code: result.code || 'unknown_error'
          });
        }
      } catch (error) {
        return createMcpResponse(false, {
          message: error.message,
          code: error.code || 'unknown_error',
          originalUrl: url,
          attemptedKeyword: keyword
        });
      }
    }
  };
}