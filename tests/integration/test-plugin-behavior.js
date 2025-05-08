/**
 * Test script to specifically verify the behavior of the Allow Existing URLs plugin
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

// Helper function to delay between API calls
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Main function
async function testPluginBehavior() {
  try {
    console.log('=======================================================');
    console.log('Testing Allow Existing URLs Plugin Behavior');
    console.log('=======================================================');
    
    // Generate a unique test URL and keywords
    const timestamp = Date.now();
    const testUrl = `https://example.com/plugin-test-${timestamp}`;
    const keyword1 = `plugin-test1-${timestamp}`;
    const keyword2 = `plugin-test2-${timestamp}`;
    
    console.log(`Test URL: ${testUrl}`);
    console.log(`First keyword: ${keyword1}`);
    console.log(`Second keyword: ${keyword2}`);
    console.log('-------------------------------------------------------');
    
    // Step 1: Create the first short URL normally
    console.log('STEP 1: Creating first short URL...');
    const result1 = await client.shorten(testUrl, keyword1);
    console.log('Result:');
    console.log(JSON.stringify(result1, null, 2));
    
    if (result1.status === 'success') {
      console.log(`✅ Successfully created first short URL: ${result1.shorturl}`);
    } else {
      console.log(`❌ Failed to create first short URL: ${result1.message || 'Unknown error'}`);
      return;
    }
    
    console.log('-------------------------------------------------------');
    await delay(1000);
    
    // Step 2: Try to create a second short URL with direct API call using force=1
    console.log('STEP 2: Attempting to create second short URL with force=1 parameter...');
    
    // Build parameters with force=1
    const params = new URLSearchParams();
    params.append('action', 'shorturl');
    params.append('url', testUrl);         // Same URL
    params.append('keyword', keyword2);     // Different keyword
    params.append('format', 'json');
    params.append('force', '1');           // Force parameter for Allow Existing URLs plugin
    
    // Add authentication
    const auth = client._getSignatureAuth();
    params.append('timestamp', auth.timestamp);
    params.append('signature', auth.signature);
    
    console.log(`Direct API call parameters: ${params.toString()}`);
    
    try {
      // Direct API call
      const response = await axios.post(config.api_url, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      const result2 = response.data;
      console.log('Result:');
      console.log(JSON.stringify(result2, null, 2));
      
      if (result2.status === 'success') {
        console.log(`✅ Successfully got response for second URL creation`);
        
        // Check if the keyword in the response is the one we requested or the existing one
        if (result2.url && result2.url.keyword === keyword2) {
          console.log(`✅ SUCCESS: Second short URL was created with a new keyword.`);
          console.log(`First URL: ${result1.shorturl} (${keyword1})`);
          console.log(`Second URL: ${result2.shorturl} (${keyword2})`);
          console.log(`Both URLs point to ${testUrl}`);
          console.log(`The Allow Existing URLs plugin IS working as expected.`);
        } else if (result2.url && result2.url.keyword === keyword1) {
          console.log(`❌ Plugin returning existing URL: The plugin returned the existing URL instead of creating a new one.`);
          console.log(`The Allow Existing URLs plugin is NOT creating new URLs - it's just returning existing ones.`);
        } else {
          console.log(`⚠️ Unexpected response: The response doesn't contain the expected keyword data.`);
        }
      } else {
        console.log(`❌ Failed with direct API call: ${result2.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.log('❌ Error with direct API call:');
      console.log(error.message);
      if (error.response && error.response.data) {
        console.log('API Response:');
        console.log(JSON.stringify(error.response.data, null, 2));
      }
    }
    
    console.log('-------------------------------------------------------');
    console.log('Test completed.');
    
  } catch (error) {
    console.error('Test failed with error:');
    console.error(error);
  }
}

// Run the test
testPluginBehavior();