/**
 * Comprehensive test script for YOURLS-MCP duplicate URL handling
 * Tests both the custom plugin approach and URL modification approach
 * with various URL types and edge cases
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

// Test parameters - using current timestamp to ensure unique keywords for each test run
const timestamp = Date.now().toString().substring(8);
const testUrl = 'https://example.com/test-page';
const testUrlWithParams = 'https://example.com/test-page?param1=value1&param2=value2';
const testUrlWithFragment = 'https://example.com/test-page#section1';
const testUrlWithParamsAndFragment = 'https://example.com/test-page?param1=value1#section1';
const longTestUrl = `https://example.com/test-page?${'lorem='.repeat(100)}ipsum`;

// Generate unique keywords for each test
const keyword1 = 'test1' + timestamp;
const keyword2 = 'test2' + timestamp;
const keyword3 = 'test3' + timestamp;
const keyword4 = 'test4' + timestamp;
const keyword5 = 'test5' + timestamp;
const keyword6 = 'test6' + timestamp;
const keyword7 = 'test7' + timestamp;
const keyword8 = 'test8' + timestamp;
const keyword9 = 'test9' + timestamp;
const keyword10 = 'test10' + timestamp;

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

// Helper functions for testing
async function testUrlCreation(url, keyword, title = null, usePlugin = true, forceUrlModification = false) {
  try {
    // Use the appropriate method based on the parameters
    let result;
    if (usePlugin === null) {
      // Use the regular shortenUrl method (expected to fail for duplicates)
      result = await client.shorten(url, keyword, title);
    } else {
      // Use the createCustomUrl method with the specified approach
      result = await client.createCustomUrl(url, keyword, title, false, forceUrlModification);
    }
    
    return {
      success: result.status === 'success',
      result,
      error: null
    };
  } catch (error) {
    return {
      success: false,
      result: null,
      error
    };
  }
}

async function verifyUrlExpansion(keyword, expectedUrl) {
  try {
    const result = await client.expand(keyword);
    const isExactMatch = result.longurl === expectedUrl;
    const isModifiedMatch = result.longurl.startsWith(expectedUrl) && result.longurl !== expectedUrl;
    
    return {
      success: isExactMatch || isModifiedMatch,
      result,
      isExactMatch,
      isModifiedMatch,
      error: null
    };
  } catch (error) {
    return {
      success: false,
      result: null,
      isExactMatch: false,
      isModifiedMatch: false,
      error
    };
  }
}

// Color formatting for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function logSuccess(message) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logError(message) {
  console.log(`${colors.red}❌ ${message}${colors.reset}`);
}

function logInfo(message) {
  console.log(`${colors.blue}ℹ️ ${message}${colors.reset}`);
}

function logWarning(message) {
  console.log(`${colors.yellow}⚠️ ${message}${colors.reset}`);
}

function logHeader(message) {
  console.log(`\n${colors.bright}${colors.cyan}=== ${message} ===${colors.reset}\n`);
}

// Comprehensive test suite
async function runTests() {
  console.log(`${colors.bright}${colors.magenta}YOURLS-MCP Duplicate URL Handling Comprehensive Test Suite${colors.reset}`);
  console.log(`Test started at: ${new Date().toISOString()}`);
  console.log(`Using YOURLS API: ${config.api_url}`);
  console.log(`Authentication method: ${config.auth_method}`);
  console.log(`\n`);
  
  // Results tracking
  const results = {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    pluginWorking: false,
    modificationWorking: false
  };
  
  try {
    // SECTION 1: Basic Functionality Tests
    logHeader('SECTION 1: Basic Functionality Tests');
    
    // Test 1.1: Create the first short URL - baseline to ensure API is working
    logHeader('TEST 1.1: Creating First Short URL (Baseline)');
    results.totalTests++;
    console.log(`Target URL: ${testUrl}`);
    console.log(`Keyword: ${keyword1}`);
    
    const test1 = await testUrlCreation(testUrl, keyword1, 'Test URL 1', null, false);
    console.log('Result:', JSON.stringify(test1.result, null, 2));
    
    if (test1.success) {
      logSuccess(`First short URL created successfully with keyword: ${keyword1}`);
      results.passedTests++;
    } else {
      logError(`Failed to create first short URL: ${test1.error?.message || 'Unknown error'}`);
      logError('This is a critical failure - the basic API functionality is not working');
      results.failedTests++;
      return; // Stop tests if basic functionality fails
    }
    
    // Test 1.2: Try to create a second short URL with regular method (expected failure)
    logHeader('TEST 1.2: Attempt Regular Duplicate URL Creation (Expected Failure)');
    results.totalTests++;
    console.log(`Target URL: ${testUrl} (same as Test 1.1)`);
    console.log(`Keyword: ${keyword2} (different from Test 1.1)`);
    
    const test2 = await testUrlCreation(testUrl, keyword2, 'Test URL 2', null, false);
    console.log('Result:', JSON.stringify(test2.result, null, 2));
    
    if (!test2.success) {
      logSuccess('Regular shortening failed as expected - YOURLS_UNIQUE_URLS=true setting is working');
      results.passedTests++;
    } else if (test2.success && test2.result.shorturl.includes(keyword2)) {
      logWarning('Regular shortening succeeded - your YOURLS instance might have YOURLS_UNIQUE_URLS=false');
      logInfo('This is not an error, but means duplicate URL handling is already enabled at the YOURLS level');
      results.passedTests++;
    } else if (test2.success && !test2.result.shorturl.includes(keyword2)) {
      logInfo('Regular shortening returned the existing URL as expected');
      results.passedTests++;
    } else {
      logError('Unexpected behavior with regular shortening');
      results.failedTests++;
    }
    
    // SECTION 2: Plugin Approach Tests
    logHeader('SECTION 2: Plugin Approach Tests');
    
    // Test 2.1: Create duplicate URL with plugin approach - standard URL
    logHeader('TEST 2.1: Create Duplicate URL with Plugin Approach');
    results.totalTests++;
    console.log(`Target URL: ${testUrl} (same as previous tests)`);
    console.log(`Keyword: ${keyword3} (new keyword)`);
    
    const test3 = await testUrlCreation(testUrl, keyword3, 'Test URL 3', true, false);
    console.log('Result:', JSON.stringify(test3.result, null, 2));
    
    if (test3.success) {
      logSuccess(`Duplicate URL created successfully with plugin approach using keyword: ${keyword3}`);
      logSuccess('Force Allow Duplicates plugin is working!');
      results.pluginWorking = true;
      results.passedTests++;
    } else {
      logError(`Plugin approach failed: ${test3.error?.message || 'Unknown error'}`);
      logInfo('The Force Allow Duplicates plugin might not be installed or activated.');
      logInfo('Continuing with URL modification approach tests...');
      results.failedTests++;
    }
    
    // Test 2.2: Create duplicate URL with plugin approach - URL with query parameters
    logHeader('TEST 2.2: Create Duplicate URL with Plugin Approach - URL with Query Parameters');
    results.totalTests++;
    console.log(`Target URL: ${testUrlWithParams}`);
    console.log(`Keyword: ${keyword4}`);
    
    const test4 = await testUrlCreation(testUrlWithParams, keyword4, 'Test URL with Params', true, false);
    console.log('Result:', JSON.stringify(test4.result, null, 2));
    
    if (test4.success) {
      logSuccess(`Plugin approach succeeded with URL containing query parameters using keyword: ${keyword4}`);
      results.passedTests++;
    } else {
      logError(`Plugin approach failed with URL containing query parameters: ${test4.error?.message || 'Unknown error'}`);
      results.failedTests++;
    }
    
    // Test 2.3: Create duplicate URL with plugin approach - URL with fragment
    logHeader('TEST 2.3: Create Duplicate URL with Plugin Approach - URL with Fragment');
    results.totalTests++;
    console.log(`Target URL: ${testUrlWithFragment}`);
    console.log(`Keyword: ${keyword5}`);
    
    const test5 = await testUrlCreation(testUrlWithFragment, keyword5, 'Test URL with Fragment', true, false);
    console.log('Result:', JSON.stringify(test5.result, null, 2));
    
    if (test5.success) {
      logSuccess(`Plugin approach succeeded with URL containing fragment using keyword: ${keyword5}`);
      results.passedTests++;
    } else {
      logError(`Plugin approach failed with URL containing fragment: ${test5.error?.message || 'Unknown error'}`);
      results.failedTests++;
    }
    
    // SECTION 3: URL Modification Approach Tests
    logHeader('SECTION 3: URL Modification Approach Tests');
    
    // Test 3.1: Create duplicate URL with URL modification approach - standard URL
    logHeader('TEST 3.1: Create Duplicate URL with URL Modification Approach');
    results.totalTests++;
    console.log(`Target URL: ${testUrl} (same as previous tests)`);
    console.log(`Keyword: ${keyword6} (new keyword)`);
    
    const test6 = await testUrlCreation(testUrl, keyword6, 'Test URL 6', true, true);
    console.log('Result:', JSON.stringify(test6.result, null, 2));
    
    if (test6.success) {
      logSuccess(`Duplicate URL created successfully with URL modification using keyword: ${keyword6}`);
      results.modificationWorking = true;
      results.passedTests++;
    } else {
      logError(`URL modification approach failed: ${test6.error?.message || 'Unknown error'}`);
      results.failedTests++;
    }
    
    // Test 3.2: URL modification approach with URL containing query parameters
    logHeader('TEST 3.2: URL Modification Approach - URL with Query Parameters');
    results.totalTests++;
    console.log(`Target URL: ${testUrlWithParams}`);
    console.log(`Keyword: ${keyword7}`);
    
    const test7 = await testUrlCreation(testUrlWithParams, keyword7, 'Test URL 7', true, true);
    console.log('Result:', JSON.stringify(test7.result, null, 2));
    
    if (test7.success) {
      logSuccess(`URL modification approach succeeded with URL containing query parameters using keyword: ${keyword7}`);
      results.passedTests++;
    } else {
      logError(`URL modification approach failed with URL containing query parameters: ${test7.error?.message || 'Unknown error'}`);
      results.failedTests++;
    }
    
    // Test 3.3: URL modification approach with URL containing fragment
    logHeader('TEST 3.3: URL Modification Approach - URL with Fragment');
    results.totalTests++;
    console.log(`Target URL: ${testUrlWithFragment}`);
    console.log(`Keyword: ${keyword8}`);
    
    const test8 = await testUrlCreation(testUrlWithFragment, keyword8, 'Test URL 8', true, true);
    console.log('Result:', JSON.stringify(test8.result, null, 2));
    
    if (test8.success) {
      logSuccess(`URL modification approach succeeded with URL containing fragment using keyword: ${keyword8}`);
      results.passedTests++;
    } else {
      logError(`URL modification approach failed with URL containing fragment: ${test8.error?.message || 'Unknown error'}`);
      results.failedTests++;
    }
    
    // Test 3.4: URL modification approach with complex URL (params and fragment)
    logHeader('TEST 3.4: URL Modification Approach - Complex URL');
    results.totalTests++;
    console.log(`Target URL: ${testUrlWithParamsAndFragment}`);
    console.log(`Keyword: ${keyword9}`);
    
    const test9 = await testUrlCreation(testUrlWithParamsAndFragment, keyword9, 'Test URL 9', true, true);
    console.log('Result:', JSON.stringify(test9.result, null, 2));
    
    if (test9.success) {
      logSuccess(`URL modification approach succeeded with complex URL using keyword: ${keyword9}`);
      results.passedTests++;
    } else {
      logError(`URL modification approach failed with complex URL: ${test9.error?.message || 'Unknown error'}`);
      results.failedTests++;
    }
    
    // Test 3.5: URL modification approach with very long URL
    logHeader('TEST 3.5: URL Modification Approach - Very Long URL');
    results.totalTests++;
    console.log(`Target URL: ${longTestUrl.substring(0, 50)}... (truncated, ${longTestUrl.length} chars total)`);
    console.log(`Keyword: ${keyword10}`);
    
    const test10 = await testUrlCreation(longTestUrl, keyword10, 'Test URL 10', true, true);
    console.log('Result:', test10.result ? JSON.stringify(test10.result, null, 2).substring(0, 500) + '... (truncated)' : 'Error');
    
    if (test10.success) {
      logSuccess(`URL modification approach succeeded with very long URL using keyword: ${keyword10}`);
      results.passedTests++;
    } else {
      logError(`URL modification approach failed with very long URL: ${test10.error?.message || 'Unknown error'}`);
      results.failedTests++;
    }
    
    // SECTION 4: Verification Tests
    logHeader('SECTION 4: Verification Tests');
    
    // Verify all created short URLs
    const verificationTests = [
      { keyword: keyword1, url: testUrl, description: 'First URL (regular method)' },
      { keyword: keyword3, url: testUrl, description: 'Plugin approach - standard URL' },
      { keyword: keyword4, url: testUrlWithParams, description: 'Plugin approach - URL with params' },
      { keyword: keyword5, url: testUrlWithFragment, description: 'Plugin approach - URL with fragment' },
      { keyword: keyword6, url: testUrl, description: 'URL modification - standard URL' },
      { keyword: keyword7, url: testUrlWithParams, description: 'URL modification - URL with params' },
      { keyword: keyword8, url: testUrlWithFragment, description: 'URL modification - URL with fragment' },
      { keyword: keyword9, url: testUrlWithParamsAndFragment, description: 'URL modification - complex URL' },
      { keyword: keyword10, url: longTestUrl, description: 'URL modification - very long URL' }
    ];
    
    for (let i = 0; i < verificationTests.length; i++) {
      const test = verificationTests[i];
      results.totalTests++;
      
      logHeader(`VERIFICATION ${i+1}: ${test.description}`);
      console.log(`Keyword: ${test.keyword}`);
      console.log(`Expected URL: ${test.url.length > 50 ? test.url.substring(0, 50) + '... (truncated)' : test.url}`);
      
      const verification = await verifyUrlExpansion(test.keyword, test.url);
      
      if (verification.success) {
        if (verification.isExactMatch) {
          logSuccess(`Expansion matches exactly - original URL preserved in database`);
        } else if (verification.isModifiedMatch) {
          logSuccess(`Expansion matches the URL base with a timestamp parameter - URL modification approach used`);
        }
        console.log(`Expanded URL: ${verification.result.longurl.length > 50 ? verification.result.longurl.substring(0, 50) + '... (truncated)' : verification.result.longurl}`);
        results.passedTests++;
      } else {
        logError(`Expansion failed or URL doesn't match expected value: ${verification.error?.message || 'Unknown error'}`);
        results.failedTests++;
      }
    }
    
    // SECTION 5: Results and Summary
    logHeader('TEST RESULTS SUMMARY');
    
    console.log(`Total tests: ${results.totalTests}`);
    console.log(`Passed: ${colors.green}${results.passedTests}${colors.reset}`);
    console.log(`Failed: ${results.failedTests > 0 ? colors.red + results.failedTests + colors.reset : '0'}`);
    console.log(`Success rate: ${Math.round((results.passedTests / results.totalTests) * 100)}%`);
    console.log('\n');
    
    console.log('Approach Status:');
    if (results.pluginWorking) {
      logSuccess(`Plugin approach: WORKING`);
    } else {
      logError(`Plugin approach: NOT WORKING`);
      logInfo('Make sure the Force Allow Duplicates plugin is installed and activated');
    }
    
    if (results.modificationWorking) {
      logSuccess(`URL modification approach: WORKING`);
    } else {
      logError(`URL modification approach: NOT WORKING`);
    }
    
    if (results.pluginWorking || results.modificationWorking) {
      logSuccess(`OVERALL RESULT: At least one approach is working for creating duplicate URLs`);
    } else {
      logError(`OVERALL RESULT: Both approaches failed - review your configuration`);
    }
    
  } catch (error) {
    console.error('Test suite failed with error:', error);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Fatal error:', error);
});