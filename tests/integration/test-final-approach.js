/**
 * Test script for validating the URL parameter approach
 */
import YourlsClient from '../../../src/api.js';

// Configuration for the test
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
    console.log('YOURLS URL Parameter Approach Test');
    console.log('==========================');

    // Generate a unique test URL base
    const timestamp = Date.now();
    const baseUrl = `https://example.com/test-page-${timestamp}`;
    
    // Create multiple short URLs for the same destination
    const keywords = [
      `test1-${timestamp}`,
      `test2-${timestamp}`,
      `test3-${timestamp}`
    ];
    
    console.log(`Testing with base URL: ${baseUrl}`);
    console.log('----------------------------');
    
    // Test creating multiple short URLs for the same destination URL
    for (let i = 0; i < keywords.length; i++) {
      const keyword = keywords[i];
      console.log(`\nCreating short URL #${i+1} with keyword: ${keyword}`);
      
      try {
        // Use createCustomUrl method which should handle duplicates
        const result = await client.createCustomUrl(baseUrl, keyword);
        console.log('Result:');
        console.log(JSON.stringify(result, null, 2));
        
        if (result.shorturl && result.shorturl.includes(keyword)) {
          console.log(`✅ SUCCESS: Created short URL ${i+1}: ${result.shorturl}`);
          if (result.display_url || result.internal_url) {
            console.log(`   Original URL: ${result.display_url || result.url}`);
            console.log(`   Actual stored URL: ${result.internal_url || 'Same as original'}`);
          }
        } else {
          console.log('❌ FAILURE: Short URL was not created as expected.');
        }
      } catch (error) {
        console.log(`❌ ERROR creating short URL ${i+1}:`);
        console.log(error.message);
        if (error.response && error.response.data) {
          console.log('API Response:');
          console.log(JSON.stringify(error.response.data, null, 2));
        }
      }
      
      // Add a delay between requests
      if (i < keywords.length - 1) {
        await delay(1000);
      }
    }
    
    console.log('\n----------------------------');
    console.log('Testing complete. Let\'s verify the created short URLs:');
    
    // Verify each created short URL by expanding it
    for (let i = 0; i < keywords.length; i++) {
      const keyword = keywords[i];
      console.log(`\nExpanding short URL with keyword: ${keyword}`);
      
      try {
        const result = await client.expand(keyword);
        console.log('Result:');
        console.log(JSON.stringify(result, null, 2));
        
        const longUrl = result.longurl || result.url;
        if (longUrl) {
          // Check if this is the original URL or has our parameter
          if (longUrl === baseUrl) {
            console.log(`✅ URL points to original: ${longUrl}`);
          } else if (longUrl.startsWith(baseUrl)) {
            console.log(`✅ URL points to modified version: ${longUrl}`);
            console.log(`   Original base URL: ${baseUrl}`);
          } else {
            console.log(`⚠️ URL points to unexpected destination: ${longUrl}`);
          }
        } else {
          console.log('❌ Failed to retrieve longurl.');
        }
      } catch (error) {
        console.log(`❌ ERROR expanding short URL ${i+1}:`);
        console.log(error.message);
      }
      
      // Add a delay between requests
      if (i < keywords.length - 1) {
        await delay(500);
      }
    }
    
    console.log('\n----------------------------');
    console.log('Test complete.');
    
  } catch (error) {
    console.error('Test failed with error:');
    console.error(error);
  }
}

// Run the test
runTest();