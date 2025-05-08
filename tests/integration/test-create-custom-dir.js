/**
 * Test script for using the createCustomUrl tool function directly
 */
import YourlsClient from './src/api.js';
import createCustomUrlTool from './src/tools/createCustomUrl.js';

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
const yourlsClient = new YourlsClient(config);

// Create the tool
const tool = createCustomUrlTool(yourlsClient);

// Function to test the tool
async function testCreateCustomUrl() {
  try {
    console.log('Testing createCustomUrl tool function...');
    
    // Generate a unique test URL and keyword
    const timestamp = Date.now();
    const testUrl = `https://example.com/test-${timestamp}`;
    const testKeyword = `test-${timestamp.toString().substring(8)}`;
    
    console.log(`Test URL: ${testUrl}`);
    console.log(`Test Keyword: ${testKeyword}`);
    
    // Execute the tool with force_url_modification=true
    console.log('Executing tool with force_url_modification=true...');
    const result = await tool.execute({
      url: testUrl,
      keyword: testKeyword,
      force_url_modification: true
    });
    
    // Parse the JSON result
    const jsonResult = JSON.parse(result.content);
    
    console.log('Result:');
    console.log(JSON.stringify(jsonResult, null, 2));
    
    if (jsonResult.status === 'success') {
      console.log(`✅ Success! Created short URL: ${jsonResult.shorturl}`);
      console.log(`Original URL: ${jsonResult.url}`);
      
      if (jsonResult.internal_url) {
        console.log(`Modified URL stored in YOURLS: ${jsonResult.internal_url}`);
      }
    } else {
      console.log(`❌ Failed: ${jsonResult.message || 'Unknown error'}`);
    }
    
    // Now try to create another short URL for the same URL but with a different keyword
    const testKeyword2 = `test2-${timestamp.toString().substring(8)}`;
    console.log(`\nNow creating a second short URL for the same destination:`);
    console.log(`Test URL: ${testUrl}`);
    console.log(`Test Keyword 2: ${testKeyword2}`);
    
    const result2 = await tool.execute({
      url: testUrl,
      keyword: testKeyword2,
      force_url_modification: true
    });
    
    // Parse the JSON result
    const jsonResult2 = JSON.parse(result2.content);
    
    console.log('Result:');
    console.log(JSON.stringify(jsonResult2, null, 2));
    
    if (jsonResult2.status === 'success') {
      console.log(`✅ Success! Created second short URL: ${jsonResult2.shorturl}`);
      console.log(`Original URL: ${jsonResult2.url}`);
      
      if (jsonResult2.internal_url) {
        console.log(`Modified URL stored in YOURLS: ${jsonResult2.internal_url}`);
      }
    } else {
      console.log(`❌ Failed: ${jsonResult2.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Test failed with error:');
    console.error(error);
  }
}

// Run the test
testCreateCustomUrl();