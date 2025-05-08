/**
 * URL Expansion tool implementation
 */

/**
 * Create a URL expansion tool
 * 
 * @param {object} yourlsClient - YOURLS API client
 * @returns {object} Tool definition
 */
function createExpandUrlTool(yourlsClient) {
  return {
    name: 'expand_url',
    description: 'Expand a short URL to its original long URL',
    inputSchema: {
      type: 'object',
      properties: {
        shorturl: {
          type: 'string',
          description: 'The short URL or keyword to expand'
        }
      },
      required: ['shorturl']
    },
    execute: async ({ shorturl }) => {
      try {
        const result = await yourlsClient.expand(shorturl);
        
        if (result.longurl) {
          return {
            contentType: 'application/json',
            content: JSON.stringify({
              status: 'success',
              shorturl: result.shorturl || shorturl,
              longurl: result.longurl,
              title: result.title || ''
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

module.exports = createExpandUrlTool;