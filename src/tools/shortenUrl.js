/**
 * URL Shortening tool implementation
 */

/**
 * Create a URL shortening tool
 * 
 * @param {object} yourlsClient - YOURLS API client
 * @returns {object} Tool definition
 */
function createShortenUrlTool(yourlsClient) {
  return {
    name: 'shorten_url',
    description: 'Shorten a long URL using YOURLS',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The URL to shorten'
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
      required: ['url']
    },
    execute: async ({ url, keyword, title }) => {
      try {
        const result = await yourlsClient.shorten(url, keyword, title);
        
        if (result.shorturl) {
          return {
            contentType: 'application/json',
            content: JSON.stringify({
              status: 'success',
              shorturl: result.shorturl,
              url: result.url || url,
              title: result.title || title || ''
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

module.exports = createShortenUrlTool;