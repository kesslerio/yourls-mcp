/**
 * Test script for validating the updated Allow Existing URLs integration
 * Tests using the 'force=1' parameter in various ways
 */
import YourlsClient from './src/api.js';
import axios from 'axios';

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
    console.log('======================================================');
    console.log('YOURLS Allow Existing URLs Plugin Integration Test');
    console.log('======================================================');

    // Generate a unique test URL and keywords
    const timestamp = Date.now();
    const testUrl = `https://example.com/test-page-${timestamp}`;
    const firstKeyword = `test1-${timestamp}`;
    const secondKeyword = `test2-${timestamp}`;
    
    console.log(`Test URL: ${testUrl}`);
    console.log(`First keyword: ${firstKeyword}`);
    console.log(`Second keyword: ${secondKeyword}`);
    console.log('------------------------------------------------------');
    
    // Step 1: Create the first short URL normally
    console.log('Step 1: Creating first short URL...');
    const result1 = await client.shorten(testUrl, firstKeyword);
    console.log('Result:');
    console.log(JSON.stringify(result1, null, 2));
    
    if (result1.status === 'success') {
      console.log(`✅ Successfully created first short URL: ${result1.shorturl}`);
    } else {
      console.log(`❌ Failed to create first short URL: ${result1.message || 'Unknown error'}`);
      return;
    }
    
    console.log('------------------------------------------------------');
    await delay(1000);
    
    // Step 2: Try to create a second short URL with the same destination URL
    // using our custom method that tries multiple approaches
    console.log('Step 2: Creating second short URL with createCustomUrl()...');
    
    try {
      const result2 = await client.createCustomUrl(testUrl, secondKeyword);
      console.log('Result:');
      console.log(JSON.stringify(result2, null, 2));
      
      if (result2.status === 'success') {
        console.log(`✅ Successfully created second short URL: ${result2.shorturl}`);
        
        // Check if URL modification was used
        if (result2.internal_url && result2.internal_url !== testUrl) {
          console.log('ℹ️ URL modification approach was used');
          console.log(`Original URL: ${result2.url}`);
          console.log(`Modified URL stored internally: ${result2.internal_url}`);
        } else {
          console.log('ℹ️ Allow Existing URLs plugin was successfully used');
        }
      } else {
        console.log(`❌ Failed to create second short URL: ${result2.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.log('❌ Error creating second URL:');
      console.log(error.message);
      if (error.response && error.response.data) {
        console.log('API Response:');
        console.log(JSON.stringify(error.response.data, null, 2));
      }
    }
    
    console.log('------------------------------------------------------');
    await delay(1000);
    
    // Step 3: Test direct force parameter through raw API call
    console.log('Step 3: Testing direct API call with force=1...');
    
    try {
      // Build parameters with force=1
      const params = new URLSearchParams();
      params.append('action', 'shorturl');
      params.append('url', testUrl);
      params.append('keyword', `test3-${timestamp}`);
      params.append('format', 'json');
      params.append('force', '1');
      
      // Add authentication
      const auth = client._getSignatureAuth();
      params.append('timestamp', auth.timestamp);
      params.append('signature', auth.signature);
      
      console.log(`Making direct call with params: ${params.toString()}`);
      
      // Direct API call
      const response = await axios.post(config.api_url, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      const result3 = response.data;
      console.log('Result:');
      console.log(JSON.stringify(result3, null, 2));
      
      if (result3.status === 'success') {
        console.log(`✅ Successfully created third short URL with direct API call: ${result3.shorturl}`);
      } else {
        console.log(`❌ Failed with direct API call: ${result3.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.log('❌ Error with direct API call:');
      console.log(error.message);
      if (error.response && error.response.data) {
        console.log('API Response:');
        console.log(JSON.stringify(error.response.data, null, 2));
      }
    }
    
    console.log('------------------------------------------------------');
    console.log('Tests completed.');
    
  } catch (error) {
    console.error('Test failed with error:');
    console.error(error);
  }
}

// Run the test
runTest();