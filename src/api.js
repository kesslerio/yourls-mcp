/**
 * YOURLS API client
 */
import axios from 'axios';
import crypto from 'crypto';

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
}