/**
 * Test runner script with mock configuration
 * This provides a simulated environment for testing the duplicate URL functionality
 */

// Set up mock environment variables
process.env.YOURLS_DEBUG = 'true';
process.env.YOURLS_API_URL = 'https://example-yourls.com/yourls-api.php'; // Replace with your test instance
process.env.YOURLS_AUTH_METHOD = 'signature';
process.env.YOURLS_SIGNATURE_TOKEN = 'test-token';
process.env.MOCK_TEST = 'true'; // Flag to bypass environment check

// Mock YourlsClient for testing without a real YOURLS instance
import * as path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create a mock implementation of the YourlsClient to simulate API responses
class MockYourlsClient {
  constructor(config) {
    this.api_url = config.api_url;
    this.auth_method = config.auth_method;
    this.signature_token = config.signature_token;
    console.log(`Mock YOURLS client created for ${this.api_url}`);
    
    // Track which keywords have been created
    this.createdKeywords = new Set();
    this.keywordUrls = new Map();
  }
  
  async shorten(url, keyword, title) {
    console.log(`[MOCK] Shortening URL: ${url} with keyword: ${keyword}`);
    
    // Check if keyword already exists
    if (this.createdKeywords.has(keyword)) {
      if (this.keywordUrls.get(keyword) === url) {
        return {
          status: 'success',
          message: 'Short URL already exists',
          shorturl: `${this.api_url.replace('yourls-api.php', '')}${keyword}`,
          url: url,
          title: title || 'Test Title',
          url_exists: true
        };
      } else {
        // Return simulated error for existing keyword with different URL
        return {
          status: 'fail',
          code: 'error:keyword',
          message: `Short URL ${keyword} already exists in database or is reserved`,
        };
      }
    }
    
    // Create new short URL
    this.createdKeywords.add(keyword);
    this.keywordUrls.set(keyword, url);
    
    return {
      status: 'success',
      message: 'Short URL created',
      shorturl: `${this.api_url.replace('yourls-api.php', '')}${keyword}`,
      url: url,
      title: title || 'Test Title'
    };
  }
  
  async createCustomUrl(url, keyword, title, bypassShortShort = false, forceUrlModification = false) {
    console.log(`[MOCK] Creating custom URL: ${url} with keyword: ${keyword}, forceUrlModification: ${forceUrlModification}`);
    
    // Check if keyword already exists
    if (this.createdKeywords.has(keyword)) {
      if (this.keywordUrls.get(keyword) === url) {
        return {
          status: 'success',
          message: 'Short URL already exists',
          shorturl: `${this.api_url.replace('yourls-api.php', '')}${keyword}`,
          url: url,
          title: title || 'Test Title'
        };
      } else if (!forceUrlModification) {
        // Simulate plugin approach (force=1)
        // In a real system with the plugin, this would create the URL anyway
        this.createdKeywords.add(keyword);
        this.keywordUrls.set(keyword, url);
        
        return {
          status: 'success',
          message: 'Short URL created successfully with plugin approach',
          shorturl: `${this.api_url.replace('yourls-api.php', '')}${keyword}`,
          url: url,
          title: title || 'Test Title'
        };
      }
    }
    
    // For forceUrlModification or as a fallback
    if (forceUrlModification) {
      // Modify the URL by adding a timestamp parameter
      const timestamp = Date.now();
      const modifiedUrl = url + (url.includes('?') ? '&' : '?') + '_t=' + timestamp;
      
      // Create the short URL with the modified URL
      this.createdKeywords.add(keyword);
      this.keywordUrls.set(keyword, modifiedUrl);
      
      return {
        status: 'success',
        message: 'Short URL created successfully with URL modification',
        shorturl: `${this.api_url.replace('yourls-api.php', '')}${keyword}`,
        url: url,
        display_url: url,
        internal_url: modifiedUrl,
        title: title || 'Test Title'
      };
    }
    
    // Create new short URL
    this.createdKeywords.add(keyword);
    this.keywordUrls.set(keyword, url);
    
    return {
      status: 'success',
      message: 'Short URL created',
      shorturl: `${this.api_url.replace('yourls-api.php', '')}${keyword}`,
      url: url,
      title: title || 'Test Title'
    };
  }
  
  async expand(keyword) {
    console.log(`[MOCK] Expanding keyword: ${keyword}`);
    
    // Check if keyword exists
    if (this.createdKeywords.has(keyword)) {
      return {
        status: 'success',
        message: 'Short URL found',
        keyword: keyword,
        shorturl: `${this.api_url.replace('yourls-api.php', '')}${keyword}`,
        longurl: this.keywordUrls.get(keyword),
        title: 'Test Title'
      };
    } else {
      const error = new Error('Short URL not found');
      error.response = { status: 404 };
      throw error;
    }
  }
  
  async request(action, params = {}) {
    console.log(`[MOCK] Request to action: ${action} with params:`, params);
    
    if (action === 'shorturl') {
      const { url, keyword, title, force_url_modification } = params;
      
      if (force_url_modification) {
        return this.createCustomUrl(url, keyword, title, false, true);
      } else {
        return this.shorten(url, keyword, title);
      }
    }
    
    return {
      status: 'success',
      message: `Mock response for action: ${action}`
    };
  }
}

// Replace the real YourlsClient with our mock version
import * as api from '../../../src/api.js';
api.default = MockYourlsClient;

// Now run the test script
import './test-duplicate-url.js';