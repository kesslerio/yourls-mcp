/**
 * Test script for validating the Allow Existing URLs plugin fix
 */
import YourlsClient from '../../../src/api.js';

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

// Helper function to delay between API calls
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Main testing function
async function runTest() {
  try {
    console.log('==========================');
    console.log('YOURLS Duplicate URL Test');
    console.log('==========================');

    // Generate a unique test URL (to avoid existing URLs in the system)
    const timestamp = Date.now();
    const testUrl = `https://example.com/test-page-${timestamp}`;
    
    // First keyword to use
    const firstKeyword = `test1-${timestamp}`;
    
    // Second keyword that we'll attempt to use for the same URL
    const secondKeyword = `test2-${timestamp}`;
    
    console.log(`Test URL: ${testUrl}`);
    console.log(`First keyword: ${firstKeyword}`);
    console.log(`Second keyword: ${secondKeyword}`);
    console.log('----------------------------');
    
    // Step 1: Create the first short URL
    console.log('Step 1: Creating first short URL...');
    const result1 = await client.shorten(testUrl, firstKeyword);
    console.log('Result:');
    console.log(JSON.stringify(result1, null, 2));
    console.log('----------------------------');
    
    // Wait a moment before the next request
    await delay(1000);
    
    // Step 2: Try to create a second short URL for the same long URL using direct API call
    console.log('Step 2: Attempting to create second short URL for the same URL with force parameter...');
    try {
      // Use direct API call with force parameter to test our plugin
      const params = {
        url: testUrl,
        keyword: secondKeyword,
        force: '1'  // This is the key parameter for our plugin
      };
      
      const result2 = await client.request('shorturl', params);
      console.log('Result:');
      console.log(JSON.stringify(result2, null, 2));
      
      if (result2.shorturl && result2.shorturl.includes(secondKeyword)) {
        console.log('✅ SUCCESS: Second short URL was created successfully with force parameter.');
        console.log(`First shorturl: ${result1.shorturl} (${firstKeyword})`);
        console.log(`Second shorturl: ${result2.shorturl} (${secondKeyword})`);
      } else if (result2.shorturl && result2.shorturl.includes(firstKeyword)) {
        console.log('❌ FAILURE: Second short URL was not created. Instead, the existing URL was returned.');
        console.log('This indicates that the Allow Existing URLs plugin still isn\'t creating new entries.');
      }
    } catch (error) {
      console.log('❌ ERROR when creating second URL:');
      console.log(error.message);
      if (error.response && error.response.data) {
        console.log('API Response:');
        console.log(JSON.stringify(error.response.data, null, 2));
      }
    }
    
    console.log('----------------------------');
    console.log('Test complete.');
    
  } catch (error) {
    console.error('Test failed with error:');
    console.error(error);
  }
}

// Run the test
runTest();