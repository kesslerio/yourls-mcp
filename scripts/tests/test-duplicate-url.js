/**
 * Test script for YOURLS-MCP duplicate URL handling
 * Tests both the custom plugin approach and URL modification approach
 */
import YourlsClient from '../../src/api.js';

// Create a testing configuration
const config = {
  api_url: process.env.YOURLS_API_URL || 'https://your-yourls-domain.com/yourls-api.php',
  auth_method: process.env.YOURLS_AUTH_METHOD || 'signature',
  signature_token: process.env.YOURLS_SIGNATURE_TOKEN || 'your-signature-token',
  username: process.env.YOURLS_USERNAME,
  password: process.env.YOURLS_PASSWORD,
  signature_ttl: process.env.YOURLS_SIGNATURE_TTL || 43200
};

// Enable debug mode
process.env.YOURLS_DEBUG = 'true';

// Test parameters
const testUrl = 'https://example.com/test-page';
const keyword1 = 'test1' + Date.now().toString().substring(8); // Generate unique keywords
const keyword2 = 'test2' + Date.now().toString().substring(8);

// Check if configuration is valid - skip this check when using the mock client
if (process.env.MOCK_TEST !== 'true' && (!config.api_url || config.api_url === 'https://your-yourls-domain.com/yourls-api.php')) {
  console.error('ERROR: You must configure a valid YOURLS API URL.');
  console.error('Please set the following environment variables:');
  console.error('  - YOURLS_API_URL: Your YOURLS API URL');
  console.error('  - YOURLS_AUTH_METHOD: "signature" or "password"');
  console.error('  - YOURLS_SIGNATURE_TOKEN: Your signature token (for signature auth)');
  console.error('  - YOURLS_USERNAME and YOURLS_PASSWORD (for password auth)');
  process.exit(1);
}

// Create client
const client = new YourlsClient(config);

// Test both approaches
async function runTests() {
  console.log('=== YOURLS-MCP Duplicate URL Handling Test ===');
  console.log(`Test URL: ${testUrl}`);
  console.log(`Keywords: ${keyword1}, ${keyword2}`);
  console.log('\n');

  try {
    // Test 1: Create the first short URL
    console.log('=== TEST 1: Creating first short URL ===');
    const result1 = await client.shorten(testUrl, keyword1);
    console.log('Result:', JSON.stringify(result1, null, 2));
    
    if (result1.status === 'success') {
      console.log('✅ First short URL created successfully with keyword:', keyword1);
    } else {
      console.log('❌ Failed to create first short URL:', result1.message);
      return;
    }
    
    console.log('\n');

    // Test 2: Try to create a second short URL with the same destination (should fail without our solution)
    console.log('=== TEST 2: Creating second short URL (regular method - should fail) ===');
    try {
      const result2 = await client.shorten(testUrl, keyword2);
      console.log('Result:', JSON.stringify(result2, null, 2));
      
      if (result2.status === 'success' && result2.shorturl.includes(keyword2)) {
        console.log('⚠️ Regular shortening succeeded - your YOURLS instance might have YOURLS_UNIQUE_URLS=false');
      } else if (result2.status === 'success' && !result2.shorturl.includes(keyword2)) {
        console.log('ℹ️ Regular shortening returned the existing URL as expected');
      } else {
        console.log('ℹ️ Regular shortening failed as expected:', result2.message);
      }
    } catch (error) {
      console.log('ℹ️ Regular shortening failed as expected with error:', error.message);
    }
    
    console.log('\n');

    // Test 3: Try with createCustomUrl method using plugin approach
    console.log('=== TEST 3: Creating duplicate URL with custom plugin approach ===');
    try {
      const result3 = await client.createCustomUrl(testUrl, keyword2, null, false);
      console.log('Result:', JSON.stringify(result3, null, 2));
      
      if (result3.status === 'success' && result3.shorturl.includes(keyword2)) {
        console.log('✅ Duplicate URL created successfully with plugin approach using keyword:', keyword2);
        console.log('Force Allow Duplicates plugin is working!');
      } else {
        console.log('❌ Plugin approach failed:', result3.message || 'Unknown error');
      }
    } catch (error) {
      console.log('❌ Plugin approach failed with error:', error.message);
      console.log('The Force Allow Duplicates plugin might not be installed or activated.');
    }
    
    console.log('\n');

    // Test 4: Try with URL modification approach
    console.log('=== TEST 4: Creating duplicate URL with URL modification approach ===');
    const keyword3 = 'test3' + Date.now().toString().substring(8);
    
    try {
      // Create with URL modification approach
      const result4 = await client.createCustomUrl(testUrl, keyword3, null, false, true);
      console.log('Result:', JSON.stringify(result4, null, 2));
      
      if (result4.status === 'success' && result4.shorturl.includes(keyword3)) {
        console.log('✅ Duplicate URL created successfully with URL modification using keyword:', keyword3);
      } else {
        console.log('❌ URL modification approach failed:', result4.message || 'Unknown error');
      }
    } catch (error) {
      console.log('❌ URL modification approach failed with error:', error.message);
    }
    
    console.log('\n');
    console.log('=== VERIFICATION TESTS ===');

    // Test 5: Verify URL expansion for the first keyword
    console.log('=== TEST 5: Verifying first keyword points to correct URL ===');
    const expand1 = await client.expand(keyword1);
    console.log(`${keyword1} expands to: ${expand1.longurl}`);
    console.log(expand1.longurl === testUrl ? '✅ Correct URL' : '❌ Wrong URL');
    
    console.log('\n');

    // Test 6: Verify URL expansion for the second keyword
    console.log('=== TEST 6: Verifying second keyword points to correct URL ===');
    const expand2 = await client.expand(keyword2);
    console.log(`${keyword2} expands to: ${expand2.longurl}`);
    
    if (expand2.longurl === testUrl) {
      console.log('✅ Correct URL - Plugin approach worked perfectly!');
    } else if (expand2.longurl.startsWith(testUrl)) {
      console.log('ℹ️ Modified URL (timestamp added) - URL modification approach was used as fallback');
    } else {
      console.log('❌ Wrong URL');
    }
    
    console.log('\n');

    // Test 7: Verify URL expansion for the third keyword
    console.log('=== TEST 7: Verifying third keyword points to correct URL ===');
    const expand3 = await client.expand(keyword3);
    console.log(`${keyword3} expands to: ${expand3.longurl}`);
    
    if (expand3.longurl === testUrl) {
      console.log('✅ Correct URL - Something unexpected happened!');
    } else if (expand3.longurl.startsWith(testUrl)) {
      console.log('✅ Modified URL (timestamp added) - URL modification approach worked as expected');
    } else {
      console.log('❌ Wrong URL');
    }
    
    console.log('\n');

    // Summary
    console.log('=== TEST SUMMARY ===');
    console.log(`First URL: ${keyword1} -> ${expand1.longurl}`);
    console.log(`Second URL (plugin approach): ${keyword2} -> ${expand2.longurl}`);
    console.log(`Third URL (URL modification): ${keyword3} -> ${expand3.longurl}`);
    
    const pluginWorking = expand2.longurl === testUrl;
    const modificationWorking = expand3.longurl.startsWith(testUrl) && expand3.longurl !== testUrl;
    
    if (pluginWorking) {
      console.log('✅ Plugin approach: WORKING');
    } else {
      console.log('❌ Plugin approach: NOT WORKING');
      console.log('   - Make sure the Force Allow Duplicates plugin is installed and activated');
    }
    
    if (modificationWorking) {
      console.log('✅ URL modification approach: WORKING');
    } else {
      console.log('❌ URL modification approach: NOT WORKING');
    }
    
    if (pluginWorking || modificationWorking) {
      console.log('\n✅ OVERALL RESULT: At least one approach is working for creating duplicate URLs');
    } else {
      console.log('\n❌ OVERALL RESULT: Both approaches failed - review your configuration');
    }
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Fatal error:', error);
});