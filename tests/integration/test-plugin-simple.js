/**
 * Simple test script for validating the plugin-based approach after reuploading
 */
import axios from 'axios';

// Configuration for the test
const config = {
  api_url: 'https://bysha.pe/yourls-api.php',
  signature_token: '44845b557c'
};

// Main testing function
async function runTest() {
  try {
    console.log('================================');
    console.log('YOURLS Allow Existing URLs Test');
    console.log('================================');

    // Generate a unique test URL base
    const timestamp = Date.now();
    const baseUrl = `https://example.com/test-page-${timestamp}`;
    
    // First keyword to use
    const firstKeyword = `test1-simple-${timestamp}`;
    
    // Second keyword for same URL
    const secondKeyword = `test2-simple-${timestamp}`;
    
    console.log(`Base URL: ${baseUrl}`);
    console.log(`First keyword: ${firstKeyword}`);
    console.log(`Second keyword: ${secondKeyword}`);
    console.log('----------------------------');
    
    // Step 1: Create the first short URL
    console.log('Step 1: Creating first short URL...');
    
    // Generate signature
    const signature = await generateSignature(config.signature_token);
    
    // Create the first URL with basic parameters
    const result1 = await makeApiCall({
      action: 'shorturl',
      url: baseUrl,
      keyword: firstKeyword,
      ...signature
    });
    
    console.log('Result:');
    console.log(JSON.stringify(result1, null, 2));
    console.log('----------------------------');
    
    // Step 2: Try to create a second short URL for the same URL with force parameter
    console.log('Step 2: Creating second short URL with force parameter...');
    
    // Generate a new signature
    const signature2 = await generateSignature(config.signature_token);
    
    // Try with 'force' parameter added
    const result2 = await makeApiCall({
      action: 'shorturl',
      url: baseUrl,
      keyword: secondKeyword,
      force: '1',
      ...signature2
    });
    
    console.log('Result:');
    console.log(JSON.stringify(result2, null, 2));
    
    if (result2.shorturl && result2.shorturl.includes(secondKeyword)) {
      console.log('✅ SUCCESS: Second short URL was created successfully!');
      console.log(`First shorturl: ${result1.shorturl} (${firstKeyword})`);
      console.log(`Second shorturl: ${result2.shorturl} (${secondKeyword})`);
    } else if (result2.shorturl && result2.shorturl.includes(firstKeyword)) {
      console.log('❌ FAILURE: Second short URL was not created. Instead, the existing URL was returned.');
    } else {
      console.log('⚠️ UNEXPECTED RESULT');
      console.log('Check the full response above for details.');
    }
    
    console.log('----------------------------');
    console.log('Test complete.');
    
  } catch (error) {
    console.error('Test failed with error:');
    if (error.response) {
      console.error('Response data:', error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

/**
 * Generate a signature for YOURLS API authentication
 * 
 * @param {string} token - Signature token 
 * @returns {object} Signature and timestamp parameters
 */
async function generateSignature(token) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  
  // Create MD5 hash from timestamp + token
  const crypto = await import('crypto');
  const signature = crypto.default
    .createHash('md5')
    .update(timestamp + token)
    .digest('hex');
  
  return { timestamp, signature };
}

/**
 * Make an API call to YOURLS
 * 
 * @param {object} params - API parameters
 * @returns {Promise<object>} API response
 */
async function makeApiCall(params) {
  const combinedParams = {
    ...params,
    format: 'json'
  };
  
  try {
    const response = await axios.post(
      config.api_url, 
      new URLSearchParams(combinedParams), 
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error(`API Error: ${error.response.status} ${error.response.statusText}`);
      console.error('Response data:', error.response.data);
    } else {
      console.error(`API Error: ${error.message}`);
    }
    throw error;
  }
}

// Run the test
runTest();