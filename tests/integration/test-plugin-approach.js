/**
 * Test script for validating the plugin-based approach with force parameter
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
    console.log('==========================');
    console.log('YOURLS Plugin Approach Test');
    console.log('==========================');

    // Generate a unique test URL base
    const timestamp = Date.now();
    const baseUrl = `https://example.com/test-page-${timestamp}`;
    
    // First keyword to use
    const firstKeyword = `test1-plugin-${timestamp}`;
    
    // Second keyword that we'll attempt to use for the same URL with force parameter
    const secondKeyword = `test2-plugin-${timestamp}`;
    
    console.log(`Base URL: ${baseUrl}`);
    console.log(`First keyword: ${firstKeyword}`);
    console.log(`Second keyword: ${secondKeyword}`);
    console.log('----------------------------');
    
    // Step 1: Create the first short URL
    console.log('Step 1: Creating first short URL...');
    const result1 = await client.shorten(baseUrl, firstKeyword);
    console.log('Result:');
    console.log(JSON.stringify(result1, null, 2));
    console.log('----------------------------');
    
    // Step 2: Try to create a second short URL for the same URL with force parameter
    console.log('Step 2: Creating second short URL with force parameter...');
    
    try {
      // Direct request with force parameter to test the plugin
      const params = {
        url: baseUrl,  // Same URL as first request
        keyword: secondKeyword,
        force: '1'     // This should trigger our plugin
      };
      
      const result2 = await client.request('shorturl', params);
      console.log('Result:');
      console.log(JSON.stringify(result2, null, 2));
      
      if (result2.shorturl && result2.shorturl.includes(secondKeyword)) {
        console.log('✅ SUCCESS: Second short URL was created successfully with force parameter.');
        console.log(`First shorturl: ${result1.shorturl} (${firstKeyword}) - URL: ${baseUrl}`);
        console.log(`Second shorturl: ${result2.shorturl} (${secondKeyword}) - URL: ${baseUrl}`);
      } else if (result2.shorturl && result2.shorturl.includes(firstKeyword)) {
        console.log('❌ FAILURE: Second short URL was not created. Instead, the existing URL was returned.');
        console.log('This suggests that the plugin is not properly handling the force parameter.');
      } else {
        console.log('⚠️ UNEXPECTED RESULT: The response does not match expected patterns.');
        console.log('Check the full response above for details.');
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