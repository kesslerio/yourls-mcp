/**
 * Google Analytics URL Shortening tool implementation
 */
import { z } from 'zod';
import { validateUtmParameters, sanitizeUtmParameters, createMcpResponse } from '../utils.js';

/**
 * Create a tool for shortening URLs with Google Analytics UTM parameters
 * 
 * @param {object} yourlsClient - YOURLS API client
 * @returns {object} Tool definition
 */
export default function createShortenWithAnalyticsTool(yourlsClient) {
  return {
    name: 'shorten_with_analytics',
    description: 'Shorten a long URL with Google Analytics UTM parameters',
    
    parameters: {
      url: z.string().describe('The URL to shorten'),
      source: z.string().describe('UTM source parameter - identifies the source of traffic (e.g., "google", "newsletter", "twitter")'),
      medium: z.string().describe('UTM medium parameter - identifies the marketing medium (e.g., "cpc", "social", "email")'),
      campaign: z.string().describe('UTM campaign parameter - identifies the specific campaign (e.g., "summer_sale", "product_launch")'),
      term: z.string().optional().describe('UTM term parameter - identifies paid search terms'),
      content: z.string().optional().describe('UTM content parameter - differentiates ads or links pointing to the same URL'),
      keyword: z.string().optional().describe('Custom keyword for the short URL'),
      title: z.string().optional().describe('Title for the URL')
    },
    
    execute: async ({ url, source, medium, campaign, term, content, keyword, title }) => {
      try {
        // Package UTM parameters
        const utmParams = {
          source,
          medium,
          campaign,
          term,
          content
        };
        
        // Validate, sanitize, and create URL with UTM parameters
        const result = await yourlsClient.shortenWithAnalytics(url, utmParams, keyword, title);
        
        if (result.shorturl) {
          return createMcpResponse(true, {
            shorturl: result.shorturl,
            url: result.url || url,
            title: result.title || title || '',
            analytics: result.analytics
          });
        } else {
          throw new Error(result.message || 'Unknown error');
        }
      } catch (error) {
        return createMcpResponse(false, {
          message: error.message,
          code: error.code || 'unknown_error'
        });
      }
    }
  };
}