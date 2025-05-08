/**
 * Test script for validating the custom URL creation feature
 * Tests both the Allow Existing URLs plugin and URL modification approaches
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

// Helper function to delay between API calls
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Main testing function
async function runTest() {
  try {
    console.log('==========================');
    console.log('YOURLS Custom URL Creation Test');
    console.log('==========================');

    // Test cases with different URL patterns
    const testCases = [
      {
        name: "Simple URL",
        baseUrl: `https://example.com/test-page-${Date.now()}`,
        keywords: [`test1-${Date.now()}`, `test2-${Date.now()}`]
      },
      {
        name: "URL with query parameters",
        baseUrl: `https://example.com/test-page-${Date.now()}?param=value`,
        keywords: [`test3-${Date.now()}`, `test4-${Date.now()}`]
      }
    ];

    // Run all test cases
    for (const testCase of testCases) {
      console.log(`\nTesting: ${testCase.name}`);
      console.log(`URL: ${testCase.baseUrl}`);
      console.log(`Keywords: ${testCase.keywords.join(', ')}`);
      console.log('----------------------------');

      // Step 1: Create first short URL
      console.log(`Step 1: Creating first short URL with keyword ${testCase.keywords[0]}...`);
      try {
        const result1 = await client.createCustomUrl(testCase.baseUrl, testCase.keywords[0]);
        console.log('Result:');
        console.log(JSON.stringify(result1, null, 2));
        
        if (result1.shorturl) {
          console.log('✅ First URL created successfully');
        } else {
          console.log('❌ Failed to create first URL');
        }
      } catch (error) {
        console.log('❌ Error creating first URL:');
        console.log(error.message);
      }
      
      // Wait before next request
      await delay(1000);
      
      // Step 2: Create second short URL for the same destination
      console.log(`\nStep 2: Creating second short URL with keyword ${testCase.keywords[1]} for the same destination...`);
      try {
        const result2 = await client.createCustomUrl(testCase.baseUrl, testCase.keywords[1]);
        console.log('Result:');
        console.log(JSON.stringify(result2, null, 2));
        
        if (result2.shorturl && result2.shorturl.includes(testCase.keywords[1])) {
          console.log('✅ Second URL created successfully with different keyword');
          
          // Check if URL modification was used
          if (result2.internal_url && result2.internal_url !== result2.url) {
            console.log('ℹ️ URL modification approach was used');
            console.log(`Original URL: ${result2.url}`);
            console.log(`Modified URL: ${result2.internal_url}`);
          } else {
            console.log('ℹ️ Allow Existing URLs plugin approach was used');
          }
        } else {
          console.log('❌ Failed to create second URL with different keyword');
        }
      } catch (error) {
        console.log('❌ Error creating second URL:');
        console.log(error.message);
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