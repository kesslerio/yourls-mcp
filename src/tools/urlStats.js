/**
 * URL Statistics tool implementation
 */

/**
 * Create a URL statistics tool
 * 
 * @param {object} yourlsClient - YOURLS API client
 * @returns {object} Tool definition
 */
function createUrlStatsTool(yourlsClient) {
  return {
    name: 'url_stats',
    description: 'Get statistics for a shortened URL',
    inputSchema: {
      type: 'object',
      properties: {
        shorturl: {
          type: 'string',
          description: 'The short URL or keyword to get stats for'
        }
      },
      required: ['shorturl']
    },
    execute: async ({ shorturl }) => {
      try {
        const result = await yourlsClient.urlStats(shorturl);
        
        if (result.link) {
          return {
            contentType: 'application/json',
            content: JSON.stringify({
              status: 'success',
              shorturl: result.shorturl || shorturl,
              clicks: result.link.clicks || 0,
              title: result.link.title || '',
              longurl: result.link.url || ''
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

module.exports = createUrlStatsTool;