/**
 * Google Analytics URL Shortening tool implementation
 */
import { validateUrl, validateUtmParameters, sanitizeUtmParameters, createApiResponse } from '../utils.js';

/**
 * Create a URL shortening tool with Google Analytics UTM parameters
 * 
 * @param {object} yourlsClient - YOURLS API client
 * @returns {object} Tool definition
 */
export default function createShortenWithAnalyticsTool(yourlsClient) {
  return {
    name: 'shorten_with_analytics',
    description: 'Shorten a long URL with Google Analytics UTM parameters',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The URL to shorten'
        },
        source: {
          type: 'string',
          description: 'UTM source parameter (required) - identifies the source of traffic (e.g., "google", "newsletter", "twitter")'
        },
        medium: {
          type: 'string',
          description: 'UTM medium parameter (required) - identifies the marketing medium (e.g., "cpc", "social", "email")'
        },
        campaign: {
          type: 'string',
          description: 'UTM campaign parameter (required) - identifies the specific campaign (e.g., "summer_sale", "product_launch")'
        },
        term: {
          type: 'string',
          description: 'UTM term parameter (optional) - identifies paid search terms'
        },
        content: {
          type: 'string',
          description: 'UTM content parameter (optional) - differentiates ads or links pointing to the same URL'
        },
        keyword: {
          type: 'string',
          description: 'Optional custom keyword for the short URL'
        },
        title: {
          type: 'string',
          description: 'Optional title for the URL'
        }
      },
      required: ['url', 'source', 'medium', 'campaign']
    },
    execute: async ({ url, source, medium, campaign, term, content, keyword, title }) => {
      try {
        // Validate URL format first
        try {
          validateUrl(url);
        } catch (error) {
          return createApiResponse(false, {
            message: error.message,
            code: 'invalid_url'
          });
        }
        
        // Create UTM parameters object
        const utmParams = {
          source,
          medium,
          campaign,
          term,
          content
        };
        
        // Validate UTM parameters
        try {
          validateUtmParameters(utmParams);
        } catch (error) {
          return createApiResponse(false, {
            message: error.message,
            code: 'invalid_utm_params'
          });
        }
        
        // Call the API client method
        const result = await yourlsClient.shortenWithAnalytics(url, utmParams, keyword, title);
        
        if (result.shorturl) {
          return createApiResponse(true, {
            shorturl: result.shorturl,
            url: result.url || url,
            title: result.title || title || '',
            analytics: result.analytics
          });
        } else {
          return createApiResponse(false, {
            message: result.message || 'Unknown error',
            code: result.code || 'unknown'
          });
        }
      } catch (error) {
        return createApiResponse(false, {
          message: error.message,
          code: error.response?.data?.code || 'unknown_error'
        });
      }
    }
  };
}