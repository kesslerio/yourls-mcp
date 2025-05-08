/**
 * Database Statistics tool implementation
 * 
 * Uses the standardized MCP response format via createMcpResponse utility:
 * - Success: {content: [{type: 'text', text: JSON.stringify({status: 'success', ...data})}]}
 * - Error: {content: [{type: 'text', text: JSON.stringify({status: 'error', ...data})}], isError: true}
 */
import { createMcpResponse } from '../utils.js';

/**
 * Create a database statistics tool
 * 
 * @param {object} yourlsClient - YOURLS API client
 * @returns {object} Tool definition with standardized MCP response format
 */
export default function createDbStatsTool(yourlsClient) {
  return {
    name: 'db_stats',
    description: 'Get global statistics for the YOURLS instance',
    inputSchema: {
      type: 'object',
      properties: {}
    },
    execute: async () => {
      try {
        const result = await yourlsClient.dbStats();
        
        if (result['db-stats']) {
          const stats = result['db-stats'];
          return createMcpResponse(true, {
            total_links: stats.total_links || 0,
            total_clicks: stats.total_clicks || 0
          });
        } else {
          return createMcpResponse(false, {
            message: result.message || 'Unknown error',
            code: result.code || 'unknown'
          });
        }
      } catch (error) {
        return createMcpResponse(false, {
          message: error.message
        });
      }
    }
  };
}