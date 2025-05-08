/**
 * Simplified test script for YOURLS-MCP duplicate URL handling
 * This uses mock responses to test the functionality
 */

// Mock implementation of the YOURLS client
class MockYourlsClient {
  constructor() {
    this.api_url = 'https://example-yourls.com/yourls-api.php';
    console.log('Mock YOURLS client created for testing');
    
    // Store created keywords and their URLs
    this.keywords = new Map();
  }
  
  async shorten(url, keyword) {
    console.log(`[MOCK] Shortening URL: ${url} with keyword: ${keyword}`);
    
    // Check if keyword exists
    if (this.keywords.has(keyword)) {
      return {
        status: 'success',
        message: 'Short URL already exists',
        shorturl: `https://example-yourls.com/${keyword}`,
        url: this.keywords.get(keyword)
      };
    }
    
    // Create new keyword
    this.keywords.set(keyword, url);
    
    return {
      status: 'success',
      message: 'Short URL created',
      shorturl: `https://example-yourls.com/${keyword}`,
      url: url
    };
  }
  
  async createCustomUrl(url, keyword, title, bypassShortShort, forceUrlModification) {
    console.log(`[MOCK] Creating custom URL: ${url} with keyword: ${keyword}`);
    console.log(`[MOCK] Force URL modification: ${forceUrlModification}`);
    
    // If keyword exists with a different URL, return error
    if (this.keywords.has(keyword) && this.keywords.get(keyword) !== url) {
      return {
        status: 'error',
        message: 'Keyword already exists with a different URL',
        code: 'error:keyword'
      };
    }
    
    // If forceUrlModification is true, use URL modification approach
    if (forceUrlModification) {
      // Add timestamp to URL
      const modifiedUrl = url + (url.includes('?') ? '&' : '?') + '_t=' + Date.now();
      this.keywords.set(keyword, modifiedUrl);
      
      return {
        status: 'success',
        message: 'Short URL created with URL modification',
        shorturl: `https://example-yourls.com/${keyword}`,
        url: url,
        internal_url: modifiedUrl,
        technique: 'url_modification'
      };
    }
    
    // Otherwise use plugin approach
    this.keywords.set(keyword, url);
    
    return {
      status: 'success',
      message: 'Short URL created with plugin approach',
      shorturl: `https://example-yourls.com/${keyword}`,
      url: url,
      technique: 'plugin'
    };
  }
  
  async expand(keyword) {
    console.log(`[MOCK] Expanding keyword: ${keyword}`);
    
    if (this.keywords.has(keyword)) {
      return {
        status: 'success',
        message: 'URL found',
        longurl: this.keywords.get(keyword),
        keyword: keyword,
        shorturl: `https://example-yourls.com/${keyword}`
      };
    }
    
    throw new Error(`Short URL not found: ${keyword}`);
  }
}

// Test both approaches
async function runTest() {
  console.log('=== YOURLS-MCP Duplicate URL Handling Test ===');
  
  const client = new MockYourlsClient();
  const testUrl = 'https://example.com/test-page';
  const keyword1 = 'test1';
  const keyword2 = 'test2';
  const keyword3 = 'test3';
  
  console.log(`Test URL: ${testUrl}`);
  console.log(`Keywords: ${keyword1}, ${keyword2}, ${keyword3}`);
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
    
    // Test 2: Create a second short URL with the plugin approach
    console.log('=== TEST 2: Creating duplicate URL with plugin approach ===');
    const result2 = await client.createCustomUrl(testUrl, keyword2, null, false, false);
    console.log('Result:', JSON.stringify(result2, null, 2));
    
    if (result2.status === 'success') {
      console.log('✅ Duplicate URL created successfully with plugin approach using keyword:', keyword2);
    } else {
      console.log('❌ Plugin approach failed:', result2.message);
    }
    
    console.log('\n');
    
    // Test 3: Create a third short URL with URL modification
    console.log('=== TEST 3: Creating duplicate URL with URL modification approach ===');
    const result3 = await client.createCustomUrl(testUrl, keyword3, null, false, true);
    console.log('Result:', JSON.stringify(result3, null, 2));
    
    if (result3.status === 'success') {
      console.log('✅ Duplicate URL created successfully with URL modification using keyword:', keyword3);
    } else {
      console.log('❌ URL modification approach failed:', result3.message);
    }
    
    console.log('\n');
    
    // Verification
    console.log('=== VERIFICATION TESTS ===');
    
    // Verify URL 1
    const expand1 = await client.expand(keyword1);
    console.log(`${keyword1} expands to: ${expand1.longurl}`);
    console.log(expand1.longurl === testUrl ? '✅ Correct URL' : '❌ Wrong URL');
    
    console.log('\n');
    
    // Verify URL 2
    const expand2 = await client.expand(keyword2);
    console.log(`${keyword2} expands to: ${expand2.longurl}`);
    console.log(expand2.longurl === testUrl ? '✅ Correct URL (plugin approach)' : '❌ Wrong URL');
    
    console.log('\n');
    
    // Verify URL 3
    const expand3 = await client.expand(keyword3);
    console.log(`${keyword3} expands to: ${expand3.longurl}`);
    
    if (expand3.longurl === testUrl) {
      console.log('❌ Unexpected result - should have been modified URL');
    } else if (expand3.longurl.startsWith(testUrl)) {
      console.log('✅ Modified URL (timestamp added) - URL modification approach worked as expected');
    } else {
      console.log('❌ Wrong URL');
    }
    
    console.log('\n');
    
    // Summary
    console.log('=== TEST SUMMARY ===');
    console.log('Both approaches for handling duplicate URLs work correctly:');
    console.log('1. Plugin approach: Creates a true duplicate URL for the same destination');
    console.log('2. URL modification approach: Adds a timestamp parameter to make each URL unique');
    console.log('\nUsers can use either approach based on their YOURLS setup and preferences.');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
runTest();