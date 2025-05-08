/**
 * YOURLS-MCP Tool: Get detailed analytics for a short URL
 */
import { z } from 'zod';
import { createMcpResponse } from '../utils.js';

/**
 * Creates the short URL analytics tool
 * 
 * @param {object} yourlsClient - YOURLS API client instance
 * @returns {object} MCP tool definition
 */
export default function createShortUrlAnalyticsTool(yourlsClient) {
  return {
    name: 'url_analytics',
    description: 'Get detailed click analytics for a shortened URL within a date range',
    inputSchema: {
      type: 'object',
      properties: {
        shorturl: {
          type: 'string',
          description: 'The short URL or keyword to get analytics for'
        },
        date: {
          type: 'string',
          description: 'Start date for analytics (YYYY-MM-DD format)'
        },
        date_end: {
          type: 'string',
          description: 'Optional end date for analytics (YYYY-MM-DD format). Defaults to start date if not provided.'
        }
      },
      required: ['shorturl', 'date']
    },
    execute: async ({ shorturl, date, date_end }) => {
      try {
        const result = await yourlsClient.shortUrlAnalytics(shorturl, date, date_end);
        
        if (result.stats) {
          return createMcpResponse(true, {
            shorturl: shorturl,
            total_clicks: result.stats.total_clicks || 0,
            range_clicks: result.stats.range_clicks || 0,
            daily_clicks: result.stats.daily_clicks || {},
            date_range: {
              start: date,
              end: date_end || date
            }
          });
        } else {
          throw new Error(result.message || 'Unknown error');
        }
      } catch (error) {
        return createMcpResponse(false, {
          message: error.message,
          shorturl: shorturl,
          date: date,
          date_end: date_end || date
        });
      }
    }
  };
}