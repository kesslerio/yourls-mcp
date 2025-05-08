/**
 * Shared utility functions for YOURLS-MCP
 */

/**
 * Checks if an error is from a missing plugin action
 * 
 * @param {Error} error - The error object to check
 * @returns {boolean} True if the error indicates a missing plugin
 */
export function isPluginMissingError(error) {
  return error.response && 
    error.response.data && 
    (error.response.data.message === 'Unknown or missing action' ||
     error.response.data.message?.includes('Unknown action'));
}

/**
 * Detects if an error is from the ShortShort plugin
 * which prevents shortening of already shortened URLs
 * 
 * @param {Error} error - The error object to check
 * @returns {boolean} True if the error is from the ShortShort plugin
 */
export function isShortShortError(error) {
  return error.response && 
    error.response.data && 
    error.response.data.code === 'error:bypass' && 
    error.response.data.message && 
    error.response.data.message.includes('shortshort: URL is a shortened URL');
}

/**
 * Generates a consistent error response for ShortShort errors
 * 
 * @param {string} url - The original URL that was attempted to be shortened
 * @param {string} [keyword] - Optional custom keyword that was attempted
 * @returns {object} Standardized error response object
 */
export function createShortShortErrorResponse(url, keyword = null) {
  const errorResponse = {
    status: 'error',
    code: 'error:already_shortened',
    message: 'This URL appears to be a shortened URL already. The ShortShort plugin prevents shortening of already shortened URLs to avoid redirect chains.',
    originalUrl: url
  };
  
  // Add keyword if provided
  if (keyword) {
    errorResponse.attemptedKeyword = keyword;
  }
  
  return errorResponse;
}

/**
 * Creates a standardized API response object
 * 
 * @param {boolean} isSuccess - Whether the response is successful
 * @param {object} data - The response data
 * @returns {object} Standardized API response
 */
export function createApiResponse(isSuccess, data) {
  if (isSuccess) {
    return {
      contentType: 'application/json',
      content: JSON.stringify({
        status: 'success',
        ...data
      })
    };
  } else {
    return {
      contentType: 'application/json',
      content: JSON.stringify({
        status: 'error',
        ...data
      })
    };
  }
}

/**
 * Creates a standardized MCP tool response object
 * 
 * @param {boolean} isSuccess - Whether the response is successful
 * @param {object} data - The response data
 * @returns {object} Standardized MCP tool response
 */
export function createMcpResponse(isSuccess, data) {
  if (isSuccess) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            status: 'success',
            ...data
          })
        }
      ]
    };
  } else {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            status: 'error',
            ...data
          })
        }
      ],
      isError: true
    };
  }
}