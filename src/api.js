/**
 * YOURLS API client
 */
import axios from 'axios';
import crypto from 'crypto';

/**
 * Helper function to check for missing plugin errors
 *
 * @param {Error} error - The error object to check
 * @returns {boolean} True if the error indicates a missing plugin
 */
function isPluginMissingError(error) {
  return error.response && 
    error.response.data && 
    (error.response.data.message === 'Unknown or missing action' ||
     error.response.data.message?.includes('Unknown action'));
}

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
    
    try {
      const response = await axios.post(this.api_url, new URLSearchParams(requestParams), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error(`YOURLS API Error: ${error.message}`);
      if (error.response) {
        console.error(`Response data: ${JSON.stringify(error.response.data)}`);
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
   * @returns {Promise<object>} API response
   */
  async createCustomUrl(url, keyword, title) {
    try {
      // First check if the URL already exists
      const expandResult = await this.expand(keyword);
      
      // If we get here, the keyword already exists - check if it's for our URL
      if (expandResult && expandResult.longurl === url) {
        // Keyword exists and points to the same URL - return success
        return {
          status: 'success',
          shorturl: `${this.api_url.replace('yourls-api.php', '')}${keyword}`,
          url: url,
          title: title || expandResult.title,
          message: 'Short URL already exists with this keyword and target URL'
        };
      } else {
        // Keyword exists but points to a different URL - return error
        throw new Error(`Keyword "${keyword}" already exists and points to a different URL`);
      }
    } catch (error) {
      // If the error is from expand, the keyword likely doesn't exist, so we can try to create it
      if (error.response && error.response.status === 404) {
        try {
          // Try direct creation since the keyword doesn't exist
          const result = await this.shorten(url, keyword, title);
          return result;
        } catch (shortenError) {
          // If the error is because the URL already exists, we need a special approach
          if (shortenError.response && 
              shortenError.response.data && 
              shortenError.response.data.code === 'error:url' && 
              shortenError.response.data.url) {
            
            // URL already exists with a different keyword
            // YOURLS doesn't support multiple keywords for same URL via API directly
            // So we'll return a special response to handle in the UI
            return {
              status: 'success',
              message: 'URL already exists with different keyword',
              existingUrl: shortenError.response.data.url,
              existingKeyword: shortenError.response.data.url.keyword,
              existingShorturl: shortenError.response.data.shorturl,
              requestedKeyword: keyword,
              url: url,
              title: title || shortenError.response.data.title
            };
          }
          
          // For other shortening errors, throw them
          throw shortenError;
        }
      }
      
      // For other errors, just throw them
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
   * @returns {Promise<object>} API response with information about whether the URL exists
   */
  async contractUrl(url) {
    try {
      return this.request('contract', { url });
    } catch (error) {
      // If the plugin isn't installed, we'll get an error about unknown action
      if (isPluginMissingError(error)) {
        throw new Error('The contract action is not available. Please install the API Contract plugin.');
      }
      
      // Otherwise, re-throw the original error
      throw error;
    }
  }
  
  /**
   * Update a short URL to point to a different destination URL
   * 
   * @param {string} shorturl - The short URL or keyword to update
   * @param {string} url - The new destination URL
   * @param {string} [title] - Optional new title ('keep' to keep existing, 'auto' to fetch from URL)
   * @returns {Promise<object>} API response
   */
  async updateUrl(shorturl, url, title = null) {
    const params = { shorturl, url };
    
    if (title) {
      params.title = title;
    }
    
    try {
      return this.request('update', params);
    } catch (error) {
      // If the plugin isn't installed, we'll get an error about unknown action
      if (isPluginMissingError(error)) {
        throw new Error('The update action is not available. Please install the API Edit URL plugin.');
      }
      
      // Otherwise, re-throw the original error
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
   * @returns {Promise<object>} API response
   */
  async changeKeyword(oldshorturl, newshorturl, url = null, title = null) {
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
      return this.request('change_keyword', params);
    } catch (error) {
      // If the plugin isn't installed, we'll get an error about unknown action
      if (isPluginMissingError(error)) {
        throw new Error('The change_keyword action is not available. Please install the API Edit URL plugin.');
      }
      
      // Otherwise, re-throw the original error
      throw error;
    }
  }
  
  /**
   * Get the keyword(s) for a long URL
   * 
   * @param {string} url - The long URL to look up
   * @param {boolean} [exactlyOne=true] - If false, returns all keywords for this URL
   * @returns {Promise<object>} API response with keyword information
   */
  async getUrlKeyword(url, exactlyOne = true) {
    const params = { url };
    
    if (!exactlyOne) {
      params.exactly_one = 'false';
    }
    
    try {
      return this.request('geturl', params);
    } catch (error) {
      // If the plugin isn't installed, we'll get an error about unknown action
      if (isPluginMissingError(error)) {
        throw new Error('The geturl action is not available. Please install the API Edit URL plugin.');
      }
      
      // Otherwise, re-throw the original error
      throw error;
    }
  }
  
  /**
   * Delete a short URL
   * 
   * @param {string} shorturl - The short URL or keyword to delete
   * @returns {Promise<object>} API response
   */
  async deleteUrl(shorturl) {
    try {
      return this.request('delete', { shorturl });
    } catch (error) {
      // If the plugin isn't installed, we'll get an error about unknown action
      if (isPluginMissingError(error)) {
        throw new Error('The delete action is not available. Please install the API Delete plugin.');
      }
      
      // Otherwise, re-throw the original error
      throw error;
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
   * @returns {Promise<object>} API response with list of URLs
   */
  async listUrls({ sortby = 'timestamp', sortorder = 'DESC', offset = 0, perpage = 50, query = '', fields = ['*'] } = {}) {
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
      return this.request('list', { 
        sortby, 
        sortorder: sortorder.toUpperCase(), 
        offset, 
        perpage, 
        query,
        fields
      });
    } catch (error) {
      // If the plugin isn't installed, we'll get an error about unknown action
      if (isPluginMissingError(error)) {
        throw new Error('The list action is not available. Please install the API List Extended plugin.');
      }
      
      // Otherwise, re-throw the original error
      throw error;
    }
  }
  
  /**
   * Generate a QR code for a short URL
   * 
   * @param {string} shorturl - The short URL or keyword
   * @param {object} [options] - Optional configuration for QR code generation
   * @param {number} [options.size] - QR code size in pixels
   * @param {number} [options.border] - Border width
   * @param {string} [options.ecc] - Error correction level (L, M, Q, H)
   * @param {string} [options.format] - Image format (default: png)
   * @returns {Promise<object>} QR code image data as base64 string
   */
  async generateQrCode(shorturl, { size, border, ecc, format } = {}) {
    try {
      // First check if the shorturl exists
      await this.expand(shorturl);
      
      // Construct the QR code URL (YOURLS-IQRCodes plugin appends .qr to the shorturl)
      const baseUrl = this.api_url.replace('yourls-api.php', '');
      let qrUrl = `${baseUrl}${shorturl}.qr`;
      
      // Add query parameters if provided
      const params = new URLSearchParams();
      if (size) params.append('size', size);
      if (border) params.append('border', border);
      if (ecc) params.append('ecc', ecc);
      if (format) params.append('format', format);
      
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
      
      // Determine MIME type
      const contentType = response.headers['content-type'] || 'image/png';
      
      return {
        status: 'success',
        data: base64Image,
        contentType: contentType,
        url: qrUrl
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
}