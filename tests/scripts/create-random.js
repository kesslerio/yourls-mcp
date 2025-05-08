/**
 * Script to create a random short URL for Google
 */
import YourlsClient from '../../src/api.js';

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
async function createRandomShortUrl() {
  try {
    // The original URL with a timestamp to make it unique
    const timestamp = Date.now();
    const url = `https://www.google.com?_t=${timestamp}`;
    
    console.log(`Creating random short URL for ${url}...`);
    
    // Create the short URL with a random keyword
    const result = await client.shorten(url);
    
    console.log('Result:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.status === 'success') {
      console.log(`✅ Success! Created short URL: ${result.shorturl}`);
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
createRandomShortUrl();