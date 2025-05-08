/**
 * Test script for validating URL modification approach
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
    console.log('YOURLS URL Modification Test');
    console.log('==========================');

    // Generate a unique test URL base
    const timestamp = Date.now();
    
    // Test cases: we'll test both a simple URL and one with existing parameters
    const testCases = [
      {
        name: "Simple URL",
        baseUrl: `https://example.com/test-page-${timestamp}`,
        firstKeyword: `test1-simple-${timestamp}`,
        secondKeyword: `test2-simple-${timestamp}`
      },
      {
        name: "URL with existing parameters",
        baseUrl: `https://example.com/test-page-${timestamp}?param1=value1&param2=value2`,
        firstKeyword: `test1-params-${timestamp}`,
        secondKeyword: `test2-params-${timestamp}`
      }
    ];
    
    // Run tests for each test case
    for (const testCase of testCases) {
      const { name, baseUrl, firstKeyword, secondKeyword } = testCase;
      
      console.log(`\nTesting: ${name}`);
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
      
      // Step 2: Try to create a second short URL for the same URL with a parameter
      console.log('Step 2: Creating second short URL with URL parameter modification...');
      
      // Add a timestamp parameter to make the URL unique, handling existing parameters
      const modifiedUrl = baseUrl + (baseUrl.includes('?') ? '&' : '?') + `_t=${timestamp}`;
      
      try {
        const result2 = await client.shorten(modifiedUrl, secondKeyword);
        console.log('Result:');
        console.log(JSON.stringify(result2, null, 2));
        
        if (result2.shorturl && result2.shorturl.includes(secondKeyword)) {
          console.log('✅ SUCCESS: Second short URL was created successfully with URL modification.');
          console.log(`First shorturl: ${result1.shorturl} (${firstKeyword}) - URL: ${baseUrl}`);
          console.log(`Second shorturl: ${result2.shorturl} (${secondKeyword}) - URL: ${modifiedUrl}`);
        } else {
          console.log('❌ FAILURE: Second short URL was not created as expected.');
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
    }
    
    console.log('\nAll tests complete.');
    
  } catch (error) {
    console.error('Test failed with error:');
    console.error(error);
  }
}

// Run the test
runTest();