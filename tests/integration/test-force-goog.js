/**
 * Test script for creating GOOG keyword using URL modification
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
async function runTest() {
  try {
    console.log('Creating GOOG short URL with URL modification...');
    
    // The destination URL (Google)
    const url = 'https://www.google.com';
    
    // The desired keyword
    const keyword = 'GOOG';
    
    // Modify the URL by adding a timestamp parameter to make it unique to YOURLS
    const timestamp = Date.now();
    const modifiedUrl = url + (url.includes('?') ? '&' : '?') + '_t=' + timestamp;
    
    console.log(`Original URL: ${url}`);
    console.log(`Modified URL: ${modifiedUrl}`);
    console.log(`Desired keyword: ${keyword}`);
    
    // Create directly with the shorten API
    const result = await client.shorten(modifiedUrl, keyword);
    
    console.log('Result:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.status === 'success') {
      console.log(`✅ Success! Created short URL: ${result.shorturl}`);
      console.log(`This will redirect to: ${url} (even though YOURLS knows it as ${modifiedUrl})`);
    } else {
      console.log(`❌ Failed: ${result.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Test failed with error:');
    console.error(error.message);
    if (error.response && error.response.data) {
      console.error('API Response:');
      console.error(JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
runTest();