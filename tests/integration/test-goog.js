/**
 * Test script for creating GOOG keyword
 */
import YourlsClient from './src/api.js';

// Configuration (use the config from test environment)
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

// Main testing function
async function runTest() {
  try {
    console.log('Creating GOOG short URL...');
    
    const result = await client.createCustomUrl('https://www.google.com', 'GOOG');
    console.log('Result:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.status === 'success') {
      console.log(`✅ Success! Created short URL: ${result.shorturl}`);
      
      // Check if URL modification was used
      if (result.internal_url && result.internal_url !== 'https://www.google.com') {
        console.log('ℹ️ URL modification approach was used');
        console.log(`Original URL: ${result.url}`);
        console.log(`Modified URL stored internally: ${result.internal_url}`);
      } else {
        console.log('ℹ️ Allow Existing URLs plugin was successfully used');
      }
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