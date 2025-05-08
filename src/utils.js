/**
 * Shared utility functions for YOURLS-MCP
 */

// Plugin availability cache to avoid repeated checks
const pluginAvailability = {
  contract: null,
  edit_url: null,
  delete: null,
  list_extended: null,
  analytics: null,
  qrcode: null,
};

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
     error.response.data.message?.includes('Unknown action') ||
     error.response.data.message?.includes('Unknown method'));
}

/**
 * Check if a specific YOURLS plugin is available
 * 
 * @param {object} yourlsClient - The YOURLS API client instance
 * @param {string} pluginKey - Which plugin to check for
 * @param {string} testAction - The API action to test
 * @param {object} [testParams={}] - Optional parameters for the test request
 * @returns {Promise<boolean>} Whether the plugin is available
 */
export async function isPluginAvailable(yourlsClient, pluginKey, testAction, testParams = {}) {
  // Check cache first
  if (pluginAvailability[pluginKey] !== null) {
    return pluginAvailability[pluginKey];
  }
  
  try {
    // Make a test request to see if the plugin action is available
    await yourlsClient.request(testAction, testParams);
    pluginAvailability[pluginKey] = true;
    return true;
  } catch (error) {
    // If we get an error about unknown action, the plugin isn't available
    if (isPluginMissingError(error)) {
      pluginAvailability[pluginKey] = false;
      return false;
    }
    
    // Other errors indicate the plugin is available but there was another issue
    pluginAvailability[pluginKey] = true;
    return true;
  }
}

/**
 * Reset plugin availability cache
 * 
 * @param {string} [pluginKey] - Optional specific plugin to reset
 */
export function resetPluginAvailabilityCache(pluginKey) {
  if (pluginKey) {
    pluginAvailability[pluginKey] = null;
  } else {
    Object.keys(pluginAvailability).forEach(key => {
      pluginAvailability[key] = null;
    });
  }
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

/**
 * Validates a URL format using URL constructor
 *
 * @param {string} url - The URL to validate
 * @returns {boolean} True if the URL is valid
 * @throws {Error} If the URL is invalid with a descriptive message
 */
export function validateUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (error) {
    throw new Error(`Invalid URL format: ${url}`);
  }
}

/**
 * Validates required UTM parameters for Google Analytics
 *
 * @param {object} utmParams - The UTM parameters object
 * @param {string} utmParams.source - UTM source parameter
 * @param {string} utmParams.medium - UTM medium parameter
 * @param {string} utmParams.campaign - UTM campaign parameter
 * @param {string} [utmParams.term] - Optional UTM term parameter
 * @param {string} [utmParams.content] - Optional UTM content parameter
 * @returns {boolean} True if all required parameters are valid
 * @throws {Error} If any required parameter is missing or invalid
 */
export function validateUtmParameters(utmParams) {
  if (!utmParams) {
    throw new Error('UTM parameters object is required');
  }
  
  if (!utmParams.source) {
    throw new Error('UTM source parameter is required');
  }
  
  if (!utmParams.medium) {
    throw new Error('UTM medium parameter is required');
  }
  
  if (!utmParams.campaign) {
    throw new Error('UTM campaign parameter is required');
  }
  
  // Check for invalid characters that might break URL or cause security issues
  const invalidCharsRegex = /<|>|'|"|`|\\/;
  
  if (invalidCharsRegex.test(utmParams.source)) {
    throw new Error('UTM source parameter contains invalid characters');
  }
  
  if (invalidCharsRegex.test(utmParams.medium)) {
    throw new Error('UTM medium parameter contains invalid characters');
  }
  
  if (invalidCharsRegex.test(utmParams.campaign)) {
    throw new Error('UTM campaign parameter contains invalid characters');
  }
  
  if (utmParams.term && invalidCharsRegex.test(utmParams.term)) {
    throw new Error('UTM term parameter contains invalid characters');
  }
  
  if (utmParams.content && invalidCharsRegex.test(utmParams.content)) {
    throw new Error('UTM content parameter contains invalid characters');
  }
  
  return true;
}

/**
 * Sanitizes URL parameters to ensure they're safe for URL inclusion
 * 
 * @param {object} params - Object containing parameters to sanitize
 * @returns {object} Sanitized parameters object
 */
export function sanitizeUrlParameters(params) {
  const sanitized = {};
  
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      // Replace spaces and special characters with underscores
      sanitized[key] = value.toString().replace(/[^\w-_.]/g, '_');
    }
  }
  
  return sanitized;
}

/**
 * Sanitizes UTM parameters for Google Analytics
 * 
 * @param {object} utmParams - The UTM parameters object
 * @returns {object} Sanitized UTM parameters
 */
export function sanitizeUtmParameters(utmParams) {
  if (!utmParams) {
    return {};
  }
  
  const sanitized = {
    source: utmParams.source ? utmParams.source.replace(/[^\w-_.]/g, '_') : '',
    medium: utmParams.medium ? utmParams.medium.replace(/[^\w-_.]/g, '_') : '',
    campaign: utmParams.campaign ? utmParams.campaign.replace(/[^\w-_.]/g, '_') : ''
  };
  
  // Only include optional parameters if they exist
  if (utmParams.term) {
    sanitized.term = utmParams.term.replace(/[^\w-_.]/g, '_');
  }
  
  if (utmParams.content) {
    sanitized.content = utmParams.content.replace(/[^\w-_.]/g, '_');
  }
  
  return sanitized;
}