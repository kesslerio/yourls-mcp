/**
 * YOURLS API client
 */
import axios from 'axios';
import crypto from 'crypto';

// Import utility functions
import { 
  isPluginMissingError, 
  isPluginAvailable,
  validateUrl, 
  validateUtmParameters, 
  sanitizeUtmParameters,
  createFallbackInfo
} from './utils.js';

/**
 * YOURLS API client for interacting with YOURLS URL shortener
 */
export default class YourlsClient {
  /**
   * Create a new YOURLS API client
   * 
   * @param {object} config - Configuration object
   * @param {string} config.api_url - YOURLS API URL
   * @param {string} config.auth_method - Authentication method ('password' or 'signature')
   * @param {string} [config.username] - YOURLS username (for password auth)
   * @param {string} [config.password] - YOURLS password (for password auth)
   * @param {string} [config.signature_token] - YOURLS signature token (for signature auth)
   * @param {number} [config.signature_ttl=43200] - Signature time-to-live in seconds
   */
  constructor(config) {
    this.api_url = config.api_url;
    this.auth_method = config.auth_method || 'signature';
    this.signature_token = config.signature_token;
    this.signature_ttl = config.signature_ttl || 43200;
    this.username = config.username;
    this.password = config.password;
    
    if (this.auth_method === 'password' && (!this.username || !this.password)) {
      throw new Error('Username and password are required for password authentication');
    }
    
    if (this.auth_method === 'signature' && !this.signature_token) {
      throw new Error('Signature token is required for signature authentication');
    }
  }
  
  /**
   * Generate signature authentication parameters
   * 
   * @returns {object} Authentication parameters
   * @private
   */
  _getSignatureAuth() {
    if (this.auth_method !== 'signature') {
      return {};
    }
      
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = crypto
      .createHash('md5')
      .update(timestamp + this.signature_token)
      .digest('hex');
    
    return {
      timestamp,
      signature
    };
  }
  
  /**
   * Make a request to the YOURLS API
   * 
   * @param {string} action - API action to perform
   * @param {object} params - Additional parameters
   * @returns {Promise<object>} API response
   */
  async request(action, params = {}) {
    const requestParams = {
      action,
      format: 'json',
      ...params
    };
    
    // Add authentication based on method
    if (this.auth_method === 'password') {
      requestParams.username = this.username;
      requestParams.password = this.password;
    } else if (this.auth_method === 'signature') {
      Object.assign(requestParams, this._getSignatureAuth());
    }
    
    // Debug output for request
    if (process.env.YOURLS_DEBUG === 'true') {
      console.log(`[DEBUG] API Request to ${this.api_url}`);
      console.log(`[DEBUG] Action: ${action}`);
      // Don't log sensitive auth details
      const debugParams = {...requestParams};
      if (debugParams.password) debugParams.password = '********';
      if (debugParams.signature) debugParams.signature = '********';
      console.log(`[DEBUG] Params: ${JSON.stringify(debugParams)}`);
    }
    
    try {
      const response = await axios.post(this.api_url, new URLSearchParams(requestParams), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      // Debug output for response
      if (process.env.YOURLS_DEBUG === 'true') {
        console.log(`[DEBUG] API Response: ${JSON.stringify(response.data)}`);
      }
      
      return response.data;
    } catch (error) {
      console.error(`YOURLS API Error: ${error.message}`);
      if (error.response) {
        console.error(`Response data: ${JSON.stringify(error.response.data)}`);
        
        // Additional debug for errors
        if (process.env.YOURLS_DEBUG === 'true') {
          if (error.response.status) {
            console.error(`Response status: ${error.response.status}`);
          }
          if (error.response.headers) {
            console.error(`Response headers: ${JSON.stringify(error.response.headers)}`);
          }
        }
      }
      throw error;
    }
  }
  
  /**
   * Shorten a URL
   * 
   * @param {string} url - URL to shorten
   * @param {string} [keyword] - Optional custom keyword
   * @param {string} [title] - Optional title
   * @returns {Promise<object>} API response
   */
  async shorten(url, keyword, title) {
    const params = { url };
    if (keyword) params.keyword = keyword;
    if (title) params.title = title;
    
    return this.request('shorturl', params);
  }
  
  /**
   * Create a custom short URL, even if the URL already exists
   * 
   * @param {string} url - URL to shorten
   * @param {string} keyword - Custom keyword
   * @param {string} [title] - Optional title
   * @param {boolean} [bypassShortShort=false] - Whether to bypass ShortShort plugin checks
   * @param {boolean} [forceUrlModification=false] - Whether to force using URL modification approach
   * @returns {Promise<object>} API response
   */
  async createCustomUrl(url, keyword, title, bypassShortShort = false, forceUrlModification = false) {
    if (process.env.YOURLS_DEBUG === 'true') {
      console.log(`[DEBUG] createCustomUrl called with URL: ${url}, Keyword: ${keyword}, bypassShortShort: ${bypassShortShort}, forceUrlModification: ${forceUrlModification}`);
    }
    
    try {
      // Step 1: Check if the keyword already exists
      try {
        const expandResult = await this.expand(keyword);
        
        // If we get here, the keyword already exists - check if it's for our URL
        if (expandResult && expandResult.longurl === url) {
          // Keyword exists and points to the same URL - return success
          if (process.env.YOURLS_DEBUG === 'true') {
            console.log(`[DEBUG] Keyword "${keyword}" already exists and points to the same URL`);
          }
          
          return {
            status: 'success',
            shorturl: `${this.api_url.replace('yourls-api.php', '')}${keyword}`,
            url: url,
            title: title || expandResult.title,
            message: 'Short URL already exists with this keyword and target URL'
          };
        } else {
          // Keyword exists but points to a different URL - return error
          if (process.env.YOURLS_DEBUG === 'true') {
            console.log(`[DEBUG] Keyword "${keyword}" already exists but points to a different URL`);
          }
          
          throw new Error(`Keyword "${keyword}" already exists and points to a different URL`);
        }
      } catch (error) {
        // Step 2: If the keyword doesn't exist (404), try to create the URL
        if (error.response && error.response.status === 404) {
          if (process.env.YOURLS_DEBUG === 'true') {
            console.log(`[DEBUG] Keyword "${keyword}" does not exist yet, creating...`);
          }
          
          // If forceUrlModification is true, skip directly to the URL modification approach
          if (forceUrlModification) {
            if (process.env.YOURLS_DEBUG === 'true') {
              console.log('[DEBUG] Skipping plugin approach and using URL modification as requested');
            }
          } else {
            // Step 2.1: First try with direct request to the Allow Existing URLs plugin
            // This is the most direct approach that should work if the plugin is properly installed
            if (process.env.YOURLS_DEBUG === 'true') {
              console.log(`[DEBUG] Attempting direct approach with Allow Existing URLs plugin (force=1)`);
            }
          
            try {
              // Create params with force=1 for Allow Existing URLs plugin
              const params = {
                action: 'shorturl',
                url: url,
                keyword: keyword,
                title: title || '',
                format: 'json',
                force: '1'  // This is the key parameter for Allow Existing URLs plugin
              };
              
              // Add bypass parameter if requested
              if (bypassShortShort) {
                params.bypass = '1';
              }
              
              // Add authentication
              if (this.auth_method === 'password') {
                params.username = this.username;
                params.password = this.password;
              } else {
                Object.assign(params, this._getSignatureAuth());
              }
              
              // Direct POST request using URLSearchParams to ensure correct parameter format
              if (process.env.YOURLS_DEBUG === 'true') {
                const debugParams = {...params};
                if (debugParams.password) debugParams.password = '********';
                if (debugParams.signature) debugParams.signature = '********';
                console.log(`[DEBUG] Direct request params: ${JSON.stringify(debugParams)}`);
              }
              
              const response = await axios.post(this.api_url, new URLSearchParams(params), {
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded'
                }
              });
              
              const forceResult = response.data;
              
              if (process.env.YOURLS_DEBUG === 'true') {
                console.log(`[DEBUG] Direct request response: ${JSON.stringify(forceResult)}`);
              }
              
              // Check if it was successful
              if (forceResult.status === 'success' && forceResult.shorturl) {
                if (process.env.YOURLS_DEBUG === 'true') {
                  console.log(`[DEBUG] Successfully created with Allow Existing URLs plugin`);
                }
                
                // Successful! Return the result
                return forceResult;
              }
              
              // If we get here, something went wrong with the force approach
              if (process.env.YOURLS_DEBUG === 'true') {
                console.log(`[DEBUG] Allow Existing URLs plugin didn't work as expected, trying URL modification approach`);
              }
            } catch (forceError) {
              // Log the error but continue to the next approach
              if (process.env.YOURLS_DEBUG === 'true') {
                console.log(`[DEBUG] Allow Existing URLs plugin approach failed: ${forceError.message}`);
                if (forceError.response && forceError.response.data) {
                  console.log(`[DEBUG] Error response: ${JSON.stringify(forceError.response.data)}`);
                }
              }
            }
          }
          
          // Step 2.2: If "force" parameter didn't work, try the URL modification approach
          if (process.env.YOURLS_DEBUG === 'true') {
            console.log('[DEBUG] Trying URL modification approach as fallback');
          }
          
          // Modify the URL by adding a timestamp parameter to make it unique
          const timestamp = Date.now();
          const modifiedUrl = url + (url.includes('?') ? '&' : '?') + '_t=' + timestamp;
          
          try {
            // Try to create a short URL with the modified URL
            let modifiedResult;
            try {
              if (bypassShortShort) {
                modifiedResult = await this.request('shorturl', {
                  url: modifiedUrl,
                  keyword: keyword,
                  title: title,
                  bypass: '1'
                });
              } else {
                modifiedResult = await this.shorten(modifiedUrl, keyword, title);
              }
              
              // If successful, customize the response to show the original URL
              if (modifiedResult.status === 'success' && modifiedResult.shorturl) {
                if (process.env.YOURLS_DEBUG === 'true') {
                  console.log(`[DEBUG] URL modification approach successful`);
                }
                
                return {
                  ...modifiedResult,
                  display_url: url,           // Original URL for display
                  internal_url: modifiedUrl,  // Modified URL that's actually stored
                  url: url,                   // Override the URL in the response
                  message: 'New short URL created successfully'
                };
              }
            } catch (modifiedError) {
              // If this is a ShortShort error and we haven't tried bypassing it yet
              if (!bypassShortShort && 
                  modifiedError.response && 
                  modifiedError.response.data && 
                  modifiedError.response.data.code === 'error:bypass') {
                
                if (process.env.YOURLS_DEBUG === 'true') {
                  console.log('[DEBUG] Detected ShortShort plugin error, retrying with bypass parameter');
                }
                
                // Try again with bypass parameter
                return this.createCustomUrl(url, keyword, title, true);
              } else {
                // For other errors, continue with the next fallback
                if (process.env.YOURLS_DEBUG === 'true') {
                  console.log('[DEBUG] URL modification approach with shortening failed:', modifiedError.message);
                }
                throw modifiedError;
              }
            }
          } catch (error) {
            // If all fallback approaches failed, provide a clear error
            if (process.env.YOURLS_DEBUG === 'true') {
              console.log('[DEBUG] All approaches failed:', error.message);
            }
            
            throw new Error(`Unable to create custom URL with keyword "${keyword}" for URL "${url}". The Allow Existing URLs plugin may not be installed or configured correctly, and all fallback approaches failed.`);
          }
        } else {
          // For errors other than 404 (keyword not found), pass them through
          throw error;
        }
      }
    } catch (error) {
      console.error('CreateCustomUrl error:', error.message);
      throw error;
    }
  }
  
  /**
   * Expand a short URL
   * 
   * @param {string} shorturl - Short URL or keyword to expand
   * @returns {Promise<object>} API response
   */
  async expand(shorturl) {
    return this.request('expand', { shorturl });
  }
  
  /**
   * Get statistics for a short URL
   * 
   * @param {string} shorturl - Short URL or keyword
   * @returns {Promise<object>} API response
   */
  async urlStats(shorturl) {
    return this.request('url-stats', { shorturl });
  }
  
  /**
   * Get global database statistics
   * 
   * @returns {Promise<object>} API response
   */
  async dbStats() {
    return this.request('db-stats', {});
  }
  
  /**
   * Get detailed analytics for a short URL within a date range
   * 
   * @param {string} shorturl - Short URL or keyword
   * @param {string} date - Start date in YYYY-MM-DD format
   * @param {string} [dateEnd] - End date in YYYY-MM-DD format (defaults to start date if not provided)
   * @returns {Promise<object>} API response with click statistics
   */
  async shortUrlAnalytics(shorturl, date, dateEnd = null) {
    const params = { 
      shorturl, 
      date 
    };
    
    if (dateEnd) {
      params.date_end = dateEnd;
    }
    
    try {
      return this.request('shorturl_analytics', params);
    } catch (error) {
      // If the plugin isn't installed, we'll get an error about unknown action
      if (isPluginMissingError(error)) {
        throw new Error('The shorturl_analytics action is not available. Please install the API ShortURL Analytics plugin.');
      }
      
      // Otherwise, re-throw the original error
      throw error;
    }
  }
  
  /**
   * Check if a URL has been shortened without creating a new short URL
   * 
   * @param {string} url - The URL to check
   * @param {boolean} [useNativeFallback=true] - Whether to use a native fallback if the plugin is not available
   * @returns {Promise<object>} API response with information about whether the URL exists
   */
  async contractUrl(url, useNativeFallback = true) {
    try {
      // First try using the Contract plugin
      const isAvailable = await isPluginAvailable(this, 'contract', 'contract', { url: 'https://example.com' });
      
      if (isAvailable) {
        return this.request('contract', { url });
      } else if (useNativeFallback) {
        // Plugin isn't available, use our fallback implementation
        return this._contractUrlFallback(url);
      } else {
        throw new Error('The contract action is not available. Please install the API Contract plugin.');
      }
    } catch (error) {
      // If the error is from the plugin check or request, but not a missing plugin error,
      // pass it through
      if (!isPluginMissingError(error)) {
        throw error;
      }
      
      // If we're here, the plugin is missing and we need to use our fallback
      if (useNativeFallback) {
        return this._contractUrlFallback(url);
      } else {
        throw new Error('The contract action is not available. Please install the API Contract plugin.');
      }
    }
  }
  
  /**
   * Fallback implementation for the Contract plugin using standard YOURLS API
   * 
   * @param {string} url - The URL to check
   * @returns {Promise<object>} API response with information about whether the URL exists
   * @private
   */
  async _contractUrlFallback(url) {
    try {
      // Safety limit to prevent performance issues
      const MAX_RESULTS = 1000;
      
      // We can try to use the stats action with a limited results count
      // and filter for the URL we're looking for
      const listResult = await this.request('stats', { 
        limit: MAX_RESULTS, 
        filter: 'url',
        search: encodeURIComponent(url) 
      });
      
      // Process the results to match the Contract plugin's output format
      const links = [];
      let urlExists = false;
      
      if (listResult.links) {
        // Iterate through the results and find exact URL matches
        for (const [keyword, data] of Object.entries(listResult.links)) {
          if (data.url === url) {
            urlExists = true;
            links.push({
              keyword: keyword,
              shorturl: `${this.api_url.replace('yourls-api.php', '')}${keyword}`,
              title: data.title,
              url: data.url,
              date: data.timestamp,
              ip: data.ip,
              clicks: data.clicks
            });
          }
        }
      }
      
      return {
        message: 'success',
        url_exists: urlExists,
        links: links,
        ...createFallbackInfo('Uses stats API, may be slower for large databases', false, 'API Contract')
      };
    } catch (error) {
      console.error('Contract URL fallback error:', error.message);
      
      // In case of fallback failure, return a safe default
      return {
        message: 'success',
        url_exists: false,
        links: [],
        ...createFallbackInfo('Unable to search database completely', true, 'API Contract')
      };
    }
  }
  
  /**
   * Update a short URL to point to a different destination URL
   * 
   * @param {string} shorturl - The short URL or keyword to update
   * @param {string} url - The new destination URL
   * @param {string} [title] - Optional new title ('keep' to keep existing, 'auto' to fetch from URL)
   * @param {boolean} [useNativeFallback=true] - Whether to use a native fallback if the plugin is not available
   * @returns {Promise<object>} API response
   */
  async updateUrl(shorturl, url, title = null, useNativeFallback = true) {
    const params = { shorturl, url };
    
    if (title) {
      params.title = title;
    }
    
    try {
      // First check if the plugin is available
      const isAvailable = await isPluginAvailable(this, 'edit_url', 'update', { 
        shorturl: 'test', 
        url: 'https://example.com' 
      });
      
      if (isAvailable) {
        return this.request('update', params);
      } else if (useNativeFallback) {
        // Use our fallback implementation
        return this._updateUrlFallback(shorturl, url, title);
      } else {
        throw new Error('The update action is not available. Please install the API Edit URL plugin.');
      }
    } catch (error) {
      // If the error is not about a missing plugin, re-throw it
      if (!isPluginMissingError(error)) {
        throw error;
      }
      
      // If we're here, the plugin is missing and we need to use the fallback
      if (useNativeFallback) {
        return this._updateUrlFallback(shorturl, url, title);
      } else {
        throw new Error('The update action is not available. Please install the API Edit URL plugin.');
      }
    }
  }
  
  /**
   * Fallback implementation for updating a URL (via delete and recreate)
   * 
   * @param {string} shorturl - The short URL or keyword to update
   * @param {string} url - The new destination URL
   * @param {string} [title] - Optional new title
   * @returns {Promise<object>} API response
   * @private
   */
  async _updateUrlFallback(shorturl, url, title = null) {
    try {
      // First, get the current details for the shorturl
      const currentDetails = await this.expand(shorturl);
      
      if (!currentDetails || !currentDetails.longurl) {
        throw new Error(`Short URL '${shorturl}' not found.`);
      }
      
      // Safety check for URL format
      validateUrl(url);
      
      // Try to delete the existing shorturl
      // This is tricky as core YOURLS doesn't have a delete API
      // We'll try to use the "add new" action with the same keyword to overwrite
      const shortenResult = await this.request('shorturl', {
        url: url,
        keyword: shorturl,
        title: title === 'keep' ? (currentDetails.title || '') : (title || '')
      });
      
      if (shortenResult.status === 'fail' && shortenResult.code === 'error:keyword') {
        // Unable to overwrite - YOURLS doesn't allow this in the core API
        throw new Error('Unable to update URL. This requires the API Edit URL plugin. The core YOURLS API does not support updating existing URLs.');
      }
      
      return {
        status: 'success',
        statusCode: 200,
        message: 'Short URL updated',
        shorturl: shortenResult.shorturl || `${this.api_url.replace('yourls-api.php', '')}${shorturl}`,
        url: url,
        title: title === 'keep' ? (currentDetails.title || '') : (title || ''),
        ...createFallbackInfo('Some versions of YOURLS might not allow URL updates without the plugin', false, 'API Edit URL')
      };
    } catch (error) {
      console.error('Update URL fallback error:', error.message);
      throw error;
    }
  }
  
  /**
   * Change the keyword of an existing short URL
   * 
   * @param {string} oldshorturl - The existing short URL or keyword
   * @param {string} newshorturl - The new keyword to use
   * @param {string} [url] - Optional URL (if not provided, will use the URL from oldshorturl)
   * @param {string} [title] - Optional new title ('keep' to keep existing, 'auto' to fetch from URL)
   * @param {boolean} [useNativeFallback=true] - Whether to use a native fallback if the plugin is not available
   * @returns {Promise<object>} API response
   */
  async changeKeyword(oldshorturl, newshorturl, url = null, title = null, useNativeFallback = true) {
    const params = { 
      oldshorturl,
      newshorturl
    };
    
    if (url) {
      params.url = url;
    }
    
    if (title) {
      params.title = title;
    }
    
    try {
      // First check if the plugin is available
      const isAvailable = await isPluginAvailable(this, 'edit_url', 'change_keyword', { 
        oldshorturl: 'test', 
        newshorturl: 'test2' 
      });
      
      if (isAvailable) {
        return this.request('change_keyword', params);
      } else if (useNativeFallback) {
        // Use our fallback implementation
        return this._changeKeywordFallback(oldshorturl, newshorturl, url, title);
      } else {
        throw new Error('The change_keyword action is not available. Please install the API Edit URL plugin.');
      }
    } catch (error) {
      // If the error is not about a missing plugin, re-throw it
      if (!isPluginMissingError(error)) {
        throw error;
      }
      
      // If we're here, the plugin is missing and we need to use the fallback
      if (useNativeFallback) {
        return this._changeKeywordFallback(oldshorturl, newshorturl, url, title);
      } else {
        throw new Error('The change_keyword action is not available. Please install the API Edit URL plugin.');
      }
    }
  }
  
  /**
   * Fallback implementation for changing a keyword (via create and delete)
   * 
   * @param {string} oldshorturl - The existing short URL or keyword
   * @param {string} newshorturl - The new keyword to use
   * @param {string} [url] - Optional URL (if not provided, will use the URL from oldshorturl)
   * @param {string} [title] - Optional new title
   * @returns {Promise<object>} API response
   * @private
   */
  async _changeKeywordFallback(oldshorturl, newshorturl, url = null, title = null) {
    try {
      // First, get the current details for the oldshorturl
      const currentDetails = await this.expand(oldshorturl);
      
      if (!currentDetails || !currentDetails.longurl) {
        throw new Error(`Short URL '${oldshorturl}' not found.`);
      }
      
      // Use the provided URL or the one from the current short URL
      const targetUrl = url || currentDetails.longurl;
      
      // Safety check for URL format
      validateUrl(targetUrl);
      
      // Determine the title
      let targetTitle = '';
      if (title === 'keep') {
        targetTitle = currentDetails.title || '';
      } else if (title === 'auto') {
        targetTitle = ''; // Let YOURLS fetch it from the URL
      } else if (title) {
        targetTitle = title;
      } else {
        targetTitle = currentDetails.title || '';
      }
      
      // Create the new shorturl
      const shortenResult = await this.request('shorturl', {
        url: targetUrl,
        keyword: newshorturl,
        title: targetTitle
      });
      
      if (shortenResult.status === 'fail') {
        throw new Error(`Failed to create new keyword: ${shortenResult.message || 'Unknown error'}`);
      }
      
      // Limitation: We can't delete the old shorturl without the Delete plugin
      const limitations = 'Creates new keyword but cannot delete old one (requires API Delete plugin)';
      
      return {
        status: 'success',
        statusCode: 200,
        message: `Keyword changed (Note: The old keyword '${oldshorturl}' still exists)`,
        oldshorturl: oldshorturl,
        newshorturl: newshorturl,
        shorturl: shortenResult.shorturl,
        url: targetUrl,
        title: targetTitle,
        ...createFallbackInfo(limitations, true, 'API Edit URL and API Delete')
      };
    } catch (error) {
      console.error('Change keyword fallback error:', error.message);
      throw error;
    }
  }
  
  /**
   * Get the keyword(s) for a long URL
   * 
   * @param {string} url - The long URL to look up
   * @param {boolean} [exactlyOne=true] - If false, returns all keywords for this URL
   * @param {boolean} [useNativeFallback=true] - Whether to use a native fallback if the plugin is not available
   * @returns {Promise<object>} API response with keyword information
   */
  async getUrlKeyword(url, exactlyOne = true, useNativeFallback = true) {
    const params = { url };
    
    if (!exactlyOne) {
      params.exactly_one = 'false';
    }
    
    try {
      // First check if the plugin is available
      const isAvailable = await isPluginAvailable(this, 'edit_url', 'geturl', { url: 'https://example.com' });
      
      if (isAvailable) {
        return this.request('geturl', params);
      } else if (useNativeFallback) {
        // Use our fallback implementation
        return this._getUrlKeywordFallback(url, exactlyOne);
      } else {
        throw new Error('The geturl action is not available. Please install the API Edit URL plugin.');
      }
    } catch (error) {
      // If the error is not about a missing plugin, re-throw it
      if (!isPluginMissingError(error)) {
        throw error;
      }
      
      // If we're here, the plugin is missing and we need to use the fallback
      if (useNativeFallback) {
        return this._getUrlKeywordFallback(url, exactlyOne);
      } else {
        throw new Error('The geturl action is not available. Please install the API Edit URL plugin.');
      }
    }
  }
  
  /**
   * Fallback implementation for getting keywords for a URL
   * 
   * @param {string} url - The URL to look up
   * @param {boolean} exactlyOne - Whether to return only the first match
   * @returns {Promise<object>} API response
   * @private
   */
  async _getUrlKeywordFallback(url, exactlyOne) {
    try {
      // Safety limit to prevent performance issues
      const MAX_RESULTS = 1000;
      
      // We can try to use the stats action with a filter
      const listResult = await this.request('stats', { 
        limit: MAX_RESULTS,
        filter: 'url',
        search: encodeURIComponent(url) 
      });
      
      // Process the results to match the geturl plugin's output format
      const keywords = [];
      let urlExists = false;
      
      if (listResult.links) {
        // Iterate through the results and find exact URL matches
        for (const [keyword, data] of Object.entries(listResult.links)) {
          if (data.url === url) {
            urlExists = true;
            keywords.push({
              keyword: keyword,
              shorturl: `${this.api_url.replace('yourls-api.php', '')}${keyword}`,
              title: data.title,
              url: data.url,
              date: data.timestamp,
              ip: data.ip,
              clicks: data.clicks
            });
            
            // If we only want one result and we found it, break
            if (exactlyOne) {
              break;
            }
          }
        }
      }
      
      // Format the response similarly to what the geturl plugin would return
      if (urlExists) {
        if (exactlyOne && keywords.length > 0) {
          // Return just the first match
          return {
            status: 'success',
            keyword: keywords[0].keyword,
            url: keywords[0].url,
            title: keywords[0].title,
            shorturl: keywords[0].shorturl,
            message: 'success',
            ...createFallbackInfo('Search limited to latest URLs', false, 'API Edit URL')
          };
        } else {
          // Return all matches
          return {
            status: 'success',
            keywords: keywords,
            url: url,
            message: 'success',
            ...createFallbackInfo('Search limited to latest URLs', false, 'API Edit URL')
          };
        }
      } else {
        // No matches found
        return {
          status: 'fail',
          message: 'URL not found',
          ...createFallbackInfo('Search limited to latest URLs', false, 'API Edit URL')
        };
      }
    } catch (error) {
      console.error('Get URL keyword fallback error:', error.message);
      
      // In case of fallback failure, return a safe default
      return {
        status: 'fail',
        message: 'Error looking up URL: ' + error.message,
        ...createFallbackInfo('Error during fallback search', true, 'API Edit URL')
      };
    }
  }
  
  /**
   * Delete a short URL
   * 
   * @param {string} shorturl - The short URL or keyword to delete
   * @param {boolean} [useNativeFallback=true] - Whether to use a native fallback if the plugin is not available
   * @returns {Promise<object>} API response
   */
  async deleteUrl(shorturl, useNativeFallback = true) {
    try {
      // First check if the plugin is available
      const isAvailable = await isPluginAvailable(this, 'delete', 'delete', { shorturl: 'test' });
      
      if (isAvailable) {
        return this.request('delete', { shorturl });
      } else if (useNativeFallback) {
        // Use our fallback implementation with admin interface emulation
        return this._deleteUrlFallback(shorturl);
      } else {
        throw new Error('The delete action is not available. Please install the API Delete plugin.');
      }
    } catch (error) {
      // If the error is not about a missing plugin, re-throw it
      if (!isPluginMissingError(error)) {
        throw error;
      }
      
      // If we're here, the plugin is missing and we need to use the fallback
      if (useNativeFallback) {
        return this._deleteUrlFallback(shorturl);
      } else {
        throw new Error('The delete action is not available. Please install the API Delete plugin.');
      }
    }
  }
  
  /**
   * Fallback implementation for deleting a URL
   * Note: This is a limited emulation as core YOURLS API doesn't support deletion
   * 
   * @param {string} shorturl - The short URL or keyword to delete
   * @returns {Promise<object>} API response
   * @private
   */
  async _deleteUrlFallback(shorturl) {
    try {
      // First, check if the shorturl exists
      const expandResult = await this.expand(shorturl).catch(() => null);
      
      if (!expandResult || !expandResult.longurl) {
        return {
          status: 'fail',
          message: `Short URL '${shorturl}' not found.`,
          code: 'not_found',
          ...createFallbackInfo()
        };
      }
      
      // Core YOURLS doesn't provide a way to delete URLs via the API
      // We can only provide a simulated response that explains the limitation
      return {
        status: 'info',
        message: 'The core YOURLS API does not support URL deletion. Please install the API Delete plugin for this functionality.',
        code: 'not_supported',
        shorturl: shorturl,
        ...createFallbackInfo('Core YOURLS API does not support URL deletion', true, 'API Delete')
      };
    } catch (error) {
      console.error('Delete URL fallback error:', error.message);
      throw new Error(`Unable to delete URL: ${error.message}`);
    }
  }
  
  /**
   * Get a list of URLs with sorting, pagination, and filtering options
   * 
   * @param {object} options - List options
   * @param {string} [options.sortby='timestamp'] - Field to sort by (keyword, url, title, ip, timestamp, clicks)
   * @param {string} [options.sortorder='DESC'] - Sort order (ASC or DESC)
   * @param {number} [options.offset=0] - Pagination offset
   * @param {number} [options.perpage=50] - Number of results per page
   * @param {string} [options.query=''] - Optional search query for filtering by keyword
   * @param {string[]} [options.fields=['*']] - Fields to return (keyword, url, title, timestamp, ip, clicks)
   * @param {boolean} [options.useNativeFallback=true] - Whether to use a native fallback if the plugin is not available
   * @returns {Promise<object>} API response with list of URLs
   */
  async listUrls({ 
    sortby = 'timestamp', 
    sortorder = 'DESC', 
    offset = 0, 
    perpage = 50, 
    query = '', 
    fields = ['*'],
    useNativeFallback = true
  } = {}) {
    // Validate sortby field
    const validSortFields = ['keyword', 'url', 'title', 'ip', 'timestamp', 'clicks'];
    if (sortby && !validSortFields.includes(sortby)) {
      throw new Error(`Invalid sortby value. Must be one of: ${validSortFields.join(', ')}`);
    }
    
    // Validate sortorder
    if (sortorder && !['ASC', 'DESC'].includes(sortorder.toUpperCase())) {
      throw new Error('Invalid sortorder value. Must be ASC or DESC');
    }
    
    // Validate fields
    if (fields && fields.length > 0 && fields[0] !== '*') {
      const validFields = ['keyword', 'url', 'title', 'timestamp', 'ip', 'clicks'];
      const invalidFields = fields.filter(field => !validFields.includes(field));
      
      if (invalidFields.length > 0) {
        throw new Error(`Invalid fields: ${invalidFields.join(', ')}. Valid fields are: ${validFields.join(', ')}`);
      }
    }
    
    try {
      // First check if the plugin is available
      const isAvailable = await isPluginAvailable(this, 'list_extended', 'list', { perpage: 1 });
      
      if (isAvailable) {
        return this.request('list', { 
          sortby, 
          sortorder: sortorder.toUpperCase(), 
          offset, 
          perpage, 
          query,
          fields
        });
      } else if (useNativeFallback) {
        // Use our fallback implementation
        return this._listUrlsFallback(sortby, sortorder, offset, perpage, query, fields);
      } else {
        throw new Error('The list action is not available. Please install the API List Extended plugin.');
      }
    } catch (error) {
      // If the error is not about a missing plugin, re-throw it
      if (!isPluginMissingError(error)) {
        throw error;
      }
      
      // If we're here, the plugin is missing and we need to use the fallback
      if (useNativeFallback) {
        return this._listUrlsFallback(sortby, sortorder, offset, perpage, query, fields);
      } else {
        throw new Error('The list action is not available. Please install the API List Extended plugin.');
      }
    }
  }
  
  /**
   * Fetch stats data from YOURLS for the list fallback
   * 
   * @param {number} requestLimit - Number of results to request
   * @param {string} [query] - Optional search query
   * @returns {Promise<object>} Stats data from YOURLS API
   * @private
   */
  async _fetchStatsData(requestLimit, query = null) {
    // Safety limit to prevent performance issues
    const MAX_RESULTS = 1000;
    const limit = Math.min(requestLimit, MAX_RESULTS);
    
    // Build the request parameters
    const params = { limit };
    
    if (query) {
      params.filter = 'keyword'; // The only filter available in core API
      params.search = query;
    }
    
    // Make the request and return the result
    return this.request('stats', params);
  }
  
  /**
   * Convert YOURLS stats data to a sortable array
   * 
   * @param {object} statsData - Stats data from YOURLS API
   * @returns {Array} Array of link objects with keyword property
   * @private
   */
  _convertStatsToArray(statsData) {
    if (!statsData.links) {
      return [];
    }
    
    // Convert result.links object to array
    return Object.entries(statsData.links).map(([keyword, data]) => {
      return {
        keyword,
        ...data
      };
    });
  }
  
  /**
   * Sort and paginate links array based on parameters
   * 
   * @param {Array} links - Array of link objects
   * @param {string} sortby - Field to sort by
   * @param {string} sortorder - Sort order (ASC or DESC)
   * @param {number} offset - Pagination offset
   * @param {number} perpage - Number of results per page
   * @returns {Array} Sorted and paginated array of link objects
   * @private
   */
  _sortAndPaginateLinks(links, sortby, sortorder, offset, perpage) {
    // Apply sort (core YOURLS doesn't have advanced sorting)
    links.sort((a, b) => {
      let aValue = a[sortby];
      let bValue = b[sortby];
      
      // For numeric fields, convert to numbers
      if (sortby === 'clicks') {
        aValue = parseInt(aValue || '0', 10);
        bValue = parseInt(bValue || '0', 10);
      }
      
      // Apply sort direction
      const direction = sortorder.toUpperCase() === 'ASC' ? 1 : -1;
      
      if (aValue < bValue) return -1 * direction;
      if (aValue > bValue) return 1 * direction;
      return 0;
    });
    
    // Apply pagination and return
    return links.slice(offset, offset + perpage);
  }
  
  /**
   * Format links according to requested fields
   * 
   * @param {Array} links - Array of link objects
   * @param {Array} fields - Fields to include
   * @returns {object} Formatted links object
   * @private
   */
  _formatLinksWithFields(links, fields) {
    const formattedLinks = {};
    
    links.forEach(link => {
      // If specific fields were requested, filter them
      if (fields[0] !== '*') {
        const filteredLink = {};
        fields.forEach(field => {
          if (field === 'keyword') {
            filteredLink.keyword = link.keyword;
          } else if (link[field] !== undefined) {
            filteredLink[field] = link[field];
          }
        });
        formattedLinks[link.keyword] = filteredLink;
      } else {
        // Otherwise include all available fields
        formattedLinks[link.keyword] = link;
        delete formattedLinks[link.keyword].keyword; // Remove redundant keyword
      }
    });
    
    return formattedLinks;
  }
  
  /**
   * Fallback implementation for listing URLs using the stats API
   * 
   * @param {string} sortby - Field to sort by
   * @param {string} sortorder - Sort order (ASC or DESC)
   * @param {number} offset - Pagination offset
   * @param {number} perpage - Number of results per page
   * @param {string} query - Optional search query
   * @param {string[]} fields - Fields to return
   * @returns {Promise<object>} API response with list of URLs
   * @private
   */
  async _listUrlsFallback(sortby, sortorder, offset, perpage, query, fields) {
    try {
      // The core YOURLS stats action provides similar functionality but with fewer features
      // We'll use it as a fallback but with limited functionality
      
      // Fetch stats data
      const statsData = await this._fetchStatsData(perpage * 3, query);
      
      // Check for empty response
      if (!statsData.links) {
        return {
          status: 'success',
          links: {},
          total: 0,
          perpage,
          page: offset / perpage + 1,
          ...createFallbackInfo()
        };
      }
      
      // Process the data
      const linksArray = this._convertStatsToArray(statsData);
      const paginatedLinks = this._sortAndPaginateLinks(linksArray, sortby, sortorder, offset, perpage);
      const formattedLinks = this._formatLinksWithFields(paginatedLinks, fields);
      
      // Construct the response
      return {
        status: 'success',
        links: formattedLinks,
        total: linksArray.length,
        perpage,
        page: offset / perpage + 1,
        ...createFallbackInfo('Limited sorting and filtering capabilities when using core API')
      };
    } catch (error) {
      console.error('List URLs fallback error:', error.message);
      throw error;
    }
  }
  
  /**
   * Generate a QR code for a short URL
   * 
   * @param {string} shorturl - The short URL or keyword
   * @param {object} [options] - Optional configuration for QR code generation
   * @param {number} [options.size] - QR code size in pixels (1-1000)
   * @param {number} [options.border] - Border width
   * @param {string} [options.ecc] - Error correction level (L, M, Q, H)
   * @param {string} [options.format] - Image format (png, jpg, svg, etc.)
   * @returns {Promise<object>} QR code image data as base64 string
   */
  async generateQrCode(shorturl, { size, border, ecc, format } = {}) {
    // Define MIME type mapping to ensure consistency
    const formatToMimeType = {
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'svg': 'image/svg+xml',
      'gif': 'image/gif'
    };
    
    try {
      // First check if the shorturl exists
      await this.expand(shorturl);
      
      // Construct the QR code URL (YOURLS-IQRCodes plugin appends .qr to the shorturl)
      const baseUrl = this.api_url.replace('yourls-api.php', '');
      let qrUrl = `${baseUrl}${shorturl}.qr`;
      
      // Validate and normalize the parameters
      let normalizedSize, normalizedBorder, normalizedEcc, normalizedFormat;
      
      // Validate size
      if (size !== undefined) {
        normalizedSize = Number(size);
        if (isNaN(normalizedSize) || normalizedSize <= 0) {
          throw new Error('Size must be a positive number');
        }
        if (normalizedSize > 1000) {
          throw new Error('QR code size cannot exceed 1000 pixels for performance reasons');
        }
      }
      
      // Validate border
      if (border !== undefined) {
        normalizedBorder = Number(border);
        if (isNaN(normalizedBorder) || normalizedBorder < 0) {
          throw new Error('Border must be a non-negative number');
        }
      }
      
      // Validate and normalize ECC
      if (ecc !== undefined) {
        if (!['L', 'M', 'Q', 'H', 'l', 'm', 'q', 'h'].includes(ecc)) {
          throw new Error(`Error correction level '${ecc}' is not supported. Must be one of: L, M, Q, H`);
        }
        normalizedEcc = ecc.toUpperCase();
      }
      
      // Validate and normalize format
      if (format !== undefined) {
        normalizedFormat = format.toLowerCase();
        if (!Object.keys(formatToMimeType).includes(normalizedFormat)) {
          throw new Error(`Format '${format}' is not supported. Must be one of: png, jpg, jpeg, gif, svg`);
        }
      }
      
      // Add query parameters if provided
      const params = new URLSearchParams();
      if (normalizedSize !== undefined) params.append('size', normalizedSize);
      if (normalizedBorder !== undefined) params.append('border', normalizedBorder);
      if (normalizedEcc !== undefined) params.append('ecc', normalizedEcc);
      if (normalizedFormat !== undefined) params.append('format', normalizedFormat);
      
      const queryString = params.toString();
      if (queryString) {
        qrUrl += `?${queryString}`;
      }
      
      // Fetch the QR code image
      const response = await axios.get(qrUrl, {
        responseType: 'arraybuffer'
      });
      
      // Convert to base64
      const base64Image = Buffer.from(response.data, 'binary').toString('base64');
      
      // Determine MIME type - use our mapping if we know the format, otherwise use server-provided
      const contentType = normalizedFormat ? 
        formatToMimeType[normalizedFormat] : 
        (response.headers['content-type'] || 'image/png');
      
      return {
        status: 'success',
        data: base64Image,
        contentType: contentType,
        url: qrUrl,
        config: {
          size: normalizedSize,
          border: normalizedBorder,
          ecc: normalizedEcc,
          format: normalizedFormat
        }
      };
    } catch (error) {
      // If the error is from the expand method (meaning the shorturl doesn't exist)
      if (error.response && error.response.status === 404) {
        throw new Error(`The short URL or keyword '${shorturl}' was not found in the database.`);
      }
      
      // If the error is from fetching the QR code (meaning the IQRCodes plugin isn't installed)
      if (error.response && 
          (error.response.status === 404 || 
           error.response.status === 500 || 
           error.response.status === 501)) {
        throw new Error('QR code generation is not available. Please install the YOURLS-IQRCodes plugin.');
      }
      
      // For other errors, just throw them
      throw error;
    }
  }
  
  /**
   * Create a short URL with Google Analytics UTM parameters
   * 
   * @param {string} url - The URL to shorten
   * @param {object} utmParams - Google Analytics UTM parameters
   * @param {string} utmParams.source - Required: UTM source parameter
   * @param {string} utmParams.medium - Required: UTM medium parameter
   * @param {string} utmParams.campaign - Required: UTM campaign parameter
   * @param {string} [utmParams.term] - Optional: UTM term parameter
   * @param {string} [utmParams.content] - Optional: UTM content parameter
   * @param {string} [keyword] - Optional custom keyword for the short URL
   * @param {string} [title] - Optional title for the URL
   * @returns {Promise<object>} API response
   */
  async shortenWithAnalytics(url, utmParams, keyword, title) {
    // Validate URL format
    validateUrl(url);
    
    // Validate and sanitize UTM parameters
    validateUtmParameters(utmParams);
    const sanitizedUtmParams = sanitizeUtmParameters(utmParams);
    
    // Check if final URL exceeds recommended length
    const urlObj = new URL(url);
    
    // Add sanitized UTM parameters
    urlObj.searchParams.set('utm_source', sanitizedUtmParams.source);
    urlObj.searchParams.set('utm_medium', sanitizedUtmParams.medium);
    urlObj.searchParams.set('utm_campaign', sanitizedUtmParams.campaign);
    
    // Add optional UTM parameters if provided
    if (sanitizedUtmParams.term) {
      urlObj.searchParams.set('utm_term', sanitizedUtmParams.term);
    }
    
    if (sanitizedUtmParams.content) {
      urlObj.searchParams.set('utm_content', sanitizedUtmParams.content);
    }
    
    // Check URL length (common limit is 2048 characters)
    const finalUrl = urlObj.toString();
    if (finalUrl.length > 2048) {
      throw new Error('URL with UTM parameters exceeds recommended length (2048 chars)');
    }
    
    // Create the short URL with the UTM parameters
    const result = await this.shorten(finalUrl, keyword, title);
    
    // Add UTM parameters to the response
    if (result.shorturl) {
      result.analytics = {
        utm_source: sanitizedUtmParams.source,
        utm_medium: sanitizedUtmParams.medium,
        utm_campaign: sanitizedUtmParams.campaign,
        utm_term: sanitizedUtmParams.term || '',
        utm_content: sanitizedUtmParams.content || ''
      };
    }
    
    return result;
  }
}