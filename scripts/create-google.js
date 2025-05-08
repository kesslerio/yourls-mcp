/**
 * Script to create GOOGLE short URL for Google using URL parameter modification
 */
import YourlsClient from './src/api.js';
import axios from 'axios';

// Configuration
const config = {
  api_url: 'https://bysha.pe/yourls-api.php',
  auth_method: 'signature',
  signature_token: '44845b557c',
  signature_ttl: 43200 // 12 hours
};

// Set debug mode
process.env.YOURLS_DEBUG = 'true';

// Create an instance of the YOURLS client
const client = new YourlsClient(config);

// Main function
async function createGoogle() {
  try {
    // The original URL
    const url = 'https://www.google.com';
    
    // The desired keyword
    const keyword = 'GOOGLE';
    
    console.log(`Creating ${keyword} short URL for ${url}...`);
    
    // First check if the keyword exists
    try {
      const expandResult = await client.expand(keyword);
      console.log(`Keyword ${keyword} already exists and points to: ${expandResult.longurl}`);
      return;
    } catch (error) {
      // If 404, keyword doesn't exist, which is good
      if (error.response && error.response.status === 404) {
        console.log(`Keyword ${keyword} is available. Creating short URL...`);
      } else {
        throw error;
      }
    }
    
    // Modify the URL by adding a timestamp parameter to make it unique
    const timestamp = Date.now();
    const modifiedUrl = `${url}?_t=${timestamp}`;
    
    console.log(`Original URL: ${url}`);
    console.log(`Modified URL to bypass uniqueness constraints: ${modifiedUrl}`);
    
    // Create the short URL with the modified URL
    const result = await client.shorten(modifiedUrl, keyword);
    
    console.log('Result:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.status === 'success') {
      console.log(`✅ Success! Created short URL: ${result.shorturl}`);
      console.log(`  - This will redirect to: ${url}`);
      console.log(`  - Internal URL stored in YOURLS: ${modifiedUrl}`);
      console.log(`  - But it will appear as: ${url} to users`);
    } else {
      console.log(`❌ Failed: ${result.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Creation failed with error:');
    console.error(error.message);
    if (error.response && error.response.data) {
      console.error('API Response:');
      console.error(JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the function
createGoogle();