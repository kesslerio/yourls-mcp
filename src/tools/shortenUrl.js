/**
 * URL Shortening tool implementation
 */

/**
 * Create a URL shortening tool
 * 
 * @param {object} yourlsClient - YOURLS API client
 * @returns {object} Tool definition
 */
export default function createShortenUrlTool(yourlsClient) {
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
        // Check if this is a ShortShort plugin error (it blocks shortening of already-shortened URLs)
        if (error.response && 
            error.response.data && 
            error.response.data.code === 'error:bypass' && 
            error.response.data.message && 
            error.response.data.message.includes('shortshort: URL is a shortened URL')) {
          
          return {
            contentType: 'application/json',
            content: JSON.stringify({
              status: 'error',
              code: 'error:already_shortened',
              message: 'This URL appears to be a shortened URL already. The ShortShort plugin prevents shortening of already shortened URLs to avoid redirect chains.',
              originalUrl: url
            })
          };
        }
        
        // Handle all other errors
        return {
          contentType: 'application/json',
          content: JSON.stringify({
            status: 'error',
            message: error.message,
            code: error.response?.data?.code || 'unknown_error'
          })
        };
      }
    }
  };
}