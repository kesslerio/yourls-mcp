/**
 * Custom URL creation tool implementation
 * Supports creating URLs with custom keywords even for URLs that already exist
 */
import { isShortShortError, createShortShortErrorResponse, createApiResponse } from '../utils.js';

/**
 * Create a custom URL creation tool
 * 
 * @param {object} yourlsClient - YOURLS API client
 * @returns {object} Tool definition
 */
export default function createCustomUrlTool(yourlsClient) {
  return {
    name: 'create_custom_url',
    description: 'Create a custom short URL with a specific keyword, supports creating multiple short URLs for the same destination',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The URL to shorten'
        },
        keyword: {
          type: 'string',
          description: 'Custom keyword for the short URL'
        },
        title: {
          type: 'string',
          description: 'Optional title for the URL'
        },
        bypass_shortshort: {
          type: 'boolean',
          description: 'Whether to bypass the ShortShort plugin that prevents shortening already-shortened URLs'
        },
        force_url_modification: {
          type: 'boolean',
          description: 'Whether to force using URL modification approach instead of the Force Allow Duplicates plugin'
        }
      },
      required: ['url', 'keyword']
    },
    execute: async ({ url, keyword, title, bypass_shortshort, force_url_modification }) => {
      try {
        if (process.env.YOURLS_DEBUG === 'true') {
          console.log(`[DEBUG] create_custom_url tool called with URL: ${url}, Keyword: ${keyword}, bypass_shortshort: ${bypass_shortshort}, force_url_modification: ${force_url_modification}`);
        }
        
        // First check if the keyword already exists
        let keywordExists = false;
        try {
          const expandResult = await yourlsClient.expand(keyword);
          
          // If we get here, the keyword exists - check if it's for our URL
          if (expandResult && expandResult.longurl === url) {
            // Keyword exists and points to the same URL - return success
            if (process.env.YOURLS_DEBUG === 'true') {
              console.log(`[DEBUG] Keyword "${keyword}" already exists and points to the same URL`);
            }
            
            return createApiResponse(true, {
              shorturl: `${yourlsClient.api_url.replace('yourls-api.php', '')}${keyword}`,
              url: url,
              title: title || expandResult.title,
              message: 'Short URL already exists with this keyword and target URL'
            });
          } else {
            // Keyword exists but points to a different URL - return error
            if (process.env.YOURLS_DEBUG === 'true') {
              console.log(`[DEBUG] Keyword "${keyword}" already exists but points to a different URL`);
            }
            
            return createApiResponse(false, {
              message: `Keyword "${keyword}" already exists and points to a different URL`,
              code: 'error:keyword_exists'
            });
          }
        } catch (error) {
          // If 404, keyword doesn't exist (which is good)
          if (error.response && error.response.status === 404) {
            if (process.env.YOURLS_DEBUG === 'true') {
              console.log(`[DEBUG] Keyword "${keyword}" doesn't exist yet, proceeding`);
            }
          } else {
            // For other errors, pass them through
            throw error;
          }
        }
        
        // If force_url_modification is true or the Allow Existing URLs plugin doesn't work properly,
        // use the URL modification approach directly
        if (force_url_modification === true) {
          if (process.env.YOURLS_DEBUG === 'true') {
            console.log(`[DEBUG] Using URL modification approach as requested`);
          }
          
          // Modify the URL by adding a timestamp parameter to make it unique
          const timestamp = Date.now();
          const modifiedUrl = url + (url.includes('?') ? '&' : '?') + '_t=' + timestamp;
          
          try {
            // Create short URL with the modified URL
            let result;
            if (bypass_shortshort) {
              // Use direct API call with bypass parameter
              result = await yourlsClient.request('shorturl', {
                url: modifiedUrl,
                keyword: keyword,
                title: title,
                bypass: '1'
              });
            } else {
              // Use standard shortening
              result = await yourlsClient.shorten(modifiedUrl, keyword, title);
            }
            
            // If successful, return a customized response
            if (result.status === 'success') {
              return createApiResponse(true, {
                shorturl: result.shorturl,
                url: url,                         // Original URL 
                internal_url: modifiedUrl,        // Modified URL stored in YOURLS
                title: result.title || title || '',
                message: 'New short URL created successfully with URL modification'
              });
            } else {
              return createApiResponse(false, {
                message: result.message || 'Failed to create short URL',
                code: result.code || 'unknown'
              });
            }
          } catch (error) {
            // Check if this is a ShortShort plugin error
            if (isShortShortError(error)) {
              const errorResponse = createShortShortErrorResponse(url, keyword);
              errorResponse.hint = "Try setting bypass_shortshort=true to bypass this check, or use a different URL";
              return createApiResponse(false, errorResponse);
            }
            
            // Check for reserved keyword error
            if (error.response?.data?.code === 'error:keyword') {
              return createApiResponse(false, {
                message: error.response.data.message || 'Keyword already exists or is reserved',
                code: 'error:keyword'
              });
            }
            
            // Other errors
            throw error;
          }
        } else {
          // Try using the client's createCustomUrl method first
          try {
            const result = await yourlsClient.createCustomUrl(url, keyword, title, bypass_shortshort, force_url_modification);
            
            // Check if we got the correct keyword back
            if (result.shorturl && result.shorturl.includes(keyword)) {
              // Success! Got the keyword we wanted
              return createApiResponse(true, {
                shorturl: result.shorturl,
                url: result.display_url || result.url || url,
                title: result.title || title || '',
                message: result.message || 'Short URL created successfully',
                technique: force_url_modification ? 'url_modification' : 'plugin'
              });
            } else if (result.status === 'success') {
              // We got a success response but with a different keyword - the existing URL was returned
              // This means the Allow Existing URLs plugin isn't working as expected
              
              if (process.env.YOURLS_DEBUG === 'true') {
                console.log(`[DEBUG] Got existing URL instead of creating new one. Falling back to URL modification.`);
              }
              
              // Fall back to URL modification approach
              // Modify the URL by adding a timestamp parameter to make it unique
              const timestamp = Date.now();
              const modifiedUrl = url + (url.includes('?') ? '&' : '?') + '_t=' + timestamp;
              
              try {
                // Create short URL with the modified URL
                let modifiedResult;
                if (bypass_shortshort) {
                  modifiedResult = await yourlsClient.request('shorturl', {
                    url: modifiedUrl,
                    keyword: keyword,
                    title: title,
                    bypass: '1'
                  });
                } else {
                  modifiedResult = await yourlsClient.shorten(modifiedUrl, keyword, title);
                }
                
                // If successful, return a customized response
                if (modifiedResult.status === 'success') {
                  return createApiResponse(true, {
                    shorturl: modifiedResult.shorturl,
                    url: url,                         // Original URL 
                    internal_url: modifiedUrl,        // Modified URL stored in YOURLS
                    title: modifiedResult.title || title || '',
                    message: 'New short URL created successfully with URL modification'
                  });
                } else {
                  return createApiResponse(false, {
                    message: modifiedResult.message || 'Failed to create short URL',
                    code: modifiedResult.code || 'unknown'
                  });
                }
              } catch (modificationError) {
                // Check if this is a ShortShort plugin error
                if (isShortShortError(modificationError)) {
                  const errorResponse = createShortShortErrorResponse(url, keyword);
                  errorResponse.hint = "Try setting bypass_shortshort=true to bypass this check, or use a different URL";
                  return createApiResponse(false, errorResponse);
                }
                
                // Check for reserved keyword error
                if (modificationError.response?.data?.code === 'error:keyword') {
                  return createApiResponse(false, {
                    message: modificationError.response.data.message || 'Keyword already exists or is reserved',
                    code: 'error:keyword'
                  });
                }
                
                // Other errors
                throw modificationError;
              }
            } else {
              // Failed with original approach but not in a way we can handle
              return createApiResponse(false, {
                message: result.message || 'Unknown error',
                code: result.code || 'unknown'
              });
            }
          } catch (error) {
            // Check if this is a ShortShort plugin error
            if (isShortShortError(error)) {
              const errorResponse = createShortShortErrorResponse(url, keyword);
              errorResponse.hint = "Try setting bypass_shortshort=true to bypass this check, or use a different URL";
              return createApiResponse(false, errorResponse);
            }
            
            // Check for keyword already existing error
            if (error.message && error.message.includes('already exists')) {
              return createApiResponse(false, {
                message: error.message,
                code: 'error:keyword_exists'
              });
            }
            
            // Handle all other errors
            return createApiResponse(false, {
              message: error.message,
              code: error.response?.data?.code || 'unknown_error'
            });
          }
        }
      } catch (error) {
        console.error('CreateCustomUrl tool error:', error.message);
        
        return createApiResponse(false, {
          message: `Error creating custom URL: ${error.message}`,
          code: error.response?.data?.code || 'unknown_error'
        });
      }
    }
  };
}