/**
 * Database Statistics tool implementation
 */

/**
 * Create a database statistics tool
 * 
 * @param {object} yourlsClient - YOURLS API client
 * @returns {object} Tool definition
 */
function createDbStatsTool(yourlsClient) {
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
          return {
            contentType: 'application/json',
            content: JSON.stringify({
              status: 'success',
              total_links: stats.total_links || 0,
              total_clicks: stats.total_clicks || 0
            })
          };
        } else {
          return {
            contentType: 'application/json',
            content: JSON.stringify({
              status: 'error',
              message: result.message || 'Unknown error',
              code: result.code || 'unknown'
            })
          };
        }
      } catch (error) {
        return {
          contentType: 'application/json',
          content: JSON.stringify({
            status: 'error',
            message: error.message
          })
        };
      }
    }
  };
}

module.exports = createDbStatsTool;