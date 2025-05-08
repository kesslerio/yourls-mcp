/**
 * Error Handling Test for YOURLS-MCP Duplicate URL Functionality
 * 
 * This script tests various error conditions and edge cases specifically
 * for the duplicate URL handling feature, focusing on error responses,
 * validation, and fallback mechanisms.
 */
import YourlsClient from '../../src/api.js';
import { createServer } from '../../src/index.js';

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

// Check if configuration is valid
if (!config.api_url || config.api_url === 'https://your-yourls-domain.com/yourls-api.php') {
  console.error('ERROR: You must configure a valid YOURLS API URL.');
  console.error('Please set the following environment variables:');
  console.error('  - YOURLS_API_URL: Your YOURLS API URL');
  console.error('  - YOURLS_AUTH_METHOD: "signature" or "password"');
  console.error('  - YOURLS_SIGNATURE_TOKEN: Your signature token (for signature auth)');
  console.error('  - YOURLS_USERNAME and YOURLS_PASSWORD (for password auth)');
  process.exit(1);
}

// Create client and MCP server
const client = new YourlsClient(config);
const mcpServer = createServer();

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

// Logging functions
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

/**
 * Test helper functions
 */

// Helper to check if a response properly indicates an error
function isErrorResponse(result) {
  // For direct client responses
  if (result && typeof result === 'object') {
    if (result.status === 'error' || result.status === 'fail') {
      return true;
    }
    if (result.error && result.error === true) {
      return true;
    }
  }
  
  // For MCP responses
  if (result && result.content && Array.isArray(result.content)) {
    for (const item of result.content) {
      if (item.type === 'text' && item.text) {
        if (
          item.text.toLowerCase().includes('error') ||
          item.text.toLowerCase().includes('failed') ||
          item.text.toLowerCase().includes('invalid') ||
          item.text.toLowerCase().includes('cannot')
        ) {
          return true;
        }
      }
    }
  }
  
  return false;
}

// Helper to extract error message from response
function extractErrorMessage(result) {
  // For direct client responses
  if (result && typeof result === 'object') {
    if (result.message) {
      return result.message;
    }
    if (result.error && typeof result.error === 'string') {
      return result.error;
    }
  }
  
  // For MCP responses
  if (result && result.content && Array.isArray(result.content)) {
    for (const item of result.content) {
      if (item.type === 'text' && item.text) {
        if (
          item.text.toLowerCase().includes('error') ||
          item.text.toLowerCase().includes('failed') ||
          item.text.toLowerCase().includes('invalid') ||
          item.text.toLowerCase().includes('cannot')
        ) {
          return item.text;
        }
      }
    }
  }
  
  return 'Unknown error';
}

// Error test cases
async function runErrorTests() {
  console.log(`${colors.bright}${colors.magenta}YOURLS-MCP Duplicate URL Error Handling Test Suite${colors.reset}`);
  console.log(`Test started at: ${new Date().toISOString()}`);
  console.log(`Using YOURLS API: ${config.api_url}`);
  console.log(`Authentication method: ${config.auth_method}`);
  console.log(`\n`);
  
  // Test parameters
  const timestamp = Date.now();
  const baseKeyword = 'error' + timestamp.toString().substring(8);
  let keywordCounter = 1;
  
  // Results tracking
  const results = {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0
  };
  
  // Create a valid short URL to use as a reference point
  const validUrl = 'https://example.com/valid-test-page';
  const validKeyword = `${baseKeyword}${keywordCounter++}`;
  
  try {
    // First, create a valid URL for later tests
    logHeader('Creating a valid short URL for reference');
    const validResult = await client.shorten(validUrl, validKeyword);
    console.log('Valid URL Result:', JSON.stringify(validResult, null, 2));
    
    if (validResult && validResult.status === 'success') {
      logSuccess(`Created reference short URL: ${validKeyword} -> ${validUrl}`);
    } else {
      logError('Failed to create reference short URL - cannot continue testing');
      return;
    }
    
    // Now begin the error handling tests
    logHeader('SECTION 1: Input Validation Tests');
    
    // Test 1.1: Empty URL
    logHeader('TEST 1.1: Empty URL');
    results.totalTests++;
    
    try {
      const emptyUrlResult = await client.createCustomUrl('', `${baseKeyword}${keywordCounter++}`);
      console.log('Result:', JSON.stringify(emptyUrlResult, null, 2));
      
      if (isErrorResponse(emptyUrlResult)) {
        logSuccess('Properly rejected empty URL');
        logInfo(`Error message: ${extractErrorMessage(emptyUrlResult)}`);
        results.passedTests++;
      } else {
        logError('Failed to reject empty URL');
        results.failedTests++;
      }
    } catch (error) {
      logSuccess('Properly rejected empty URL with exception');
      logInfo(`Error message: ${error.message}`);
      results.passedTests++;
    }
    
    // Test 1.2: Invalid URL format
    logHeader('TEST 1.2: Invalid URL Format');
    results.totalTests++;
    
    try {
      const invalidUrlResult = await client.createCustomUrl('not-a-valid-url', `${baseKeyword}${keywordCounter++}`);
      console.log('Result:', JSON.stringify(invalidUrlResult, null, 2));
      
      if (isErrorResponse(invalidUrlResult)) {
        logSuccess('Properly rejected invalid URL format');
        logInfo(`Error message: ${extractErrorMessage(invalidUrlResult)}`);
        results.passedTests++;
      } else {
        logError('Failed to reject invalid URL format');
        results.failedTests++;
      }
    } catch (error) {
      logSuccess('Properly rejected invalid URL format with exception');
      logInfo(`Error message: ${error.message}`);
      results.passedTests++;
    }
    
    // Test 1.3: Empty keyword
    logHeader('TEST 1.3: Empty Keyword');
    results.totalTests++;
    
    try {
      const emptyKeywordResult = await client.createCustomUrl('https://example.com/test', '');
      console.log('Result:', JSON.stringify(emptyKeywordResult, null, 2));
      
      if (isErrorResponse(emptyKeywordResult)) {
        logSuccess('Properly rejected empty keyword');
        logInfo(`Error message: ${extractErrorMessage(emptyKeywordResult)}`);
        results.passedTests++;
      } else {
        logError('Failed to reject empty keyword');
        results.failedTests++;
      }
    } catch (error) {
      logSuccess('Properly rejected empty keyword with exception');
      logInfo(`Error message: ${error.message}`);
      results.passedTests++;
    }
    
    // Test 1.4: Invalid keyword characters
    logHeader('TEST 1.4: Invalid Keyword Characters');
    results.totalTests++;
    
    try {
      const invalidKeywordResult = await client.createCustomUrl('https://example.com/test', 'invalid keyword with spaces!');
      console.log('Result:', JSON.stringify(invalidKeywordResult, null, 2));
      
      if (isErrorResponse(invalidKeywordResult)) {
        logSuccess('Properly rejected invalid keyword characters');
        logInfo(`Error message: ${extractErrorMessage(invalidKeywordResult)}`);
        results.passedTests++;
      } else {
        logError('Failed to reject invalid keyword characters');
        results.failedTests++;
      }
    } catch (error) {
      logSuccess('Properly rejected invalid keyword characters with exception');
      logInfo(`Error message: ${error.message}`);
      results.passedTests++;
    }
    
    // Test 1.5: Very long URL
    logHeader('TEST 1.5: Very Long URL');
    results.totalTests++;
    
    const longUrl = `https://example.com/very-long-url?${'param='.repeat(500)}value`;
    
    try {
      const longUrlResult = await client.createCustomUrl(longUrl, `${baseKeyword}${keywordCounter++}`);
      console.log('Result (truncated):', JSON.stringify(longUrlResult, null, 2).substring(0, 500) + '...');
      
      if (longUrlResult && longUrlResult.status === 'success') {
        logSuccess('Successfully handled very long URL');
        results.passedTests++;
      } else if (isErrorResponse(longUrlResult)) {
        logInfo('Rejected very long URL - this is acceptable behavior');
        logInfo(`Error message: ${extractErrorMessage(longUrlResult)}`);
        results.passedTests++;
      } else {
        logError('Unexpected behavior with very long URL');
        results.failedTests++;
      }
    } catch (error) {
      logInfo('Rejected very long URL with exception - this is acceptable behavior');
      logInfo(`Error message: ${error.message}`);
      results.passedTests++;
    }
    
    logHeader('SECTION 2: Duplicate Keyword Tests');
    
    // Test 2.1: Attempt to create duplicate keyword for different URL
    logHeader('TEST 2.1: Duplicate Keyword for Different URL');
    results.totalTests++;
    
    try {
      const duplicateKeywordResult = await client.createCustomUrl('https://example.com/different-url', validKeyword);
      console.log('Result:', JSON.stringify(duplicateKeywordResult, null, 2));
      
      if (isErrorResponse(duplicateKeywordResult)) {
        logSuccess('Properly rejected duplicate keyword for different URL');
        logInfo(`Error message: ${extractErrorMessage(duplicateKeywordResult)}`);
        results.passedTests++;
      } else {
        logError('Failed to reject duplicate keyword for different URL');
        results.failedTests++;
      }
    } catch (error) {
      logSuccess('Properly rejected duplicate keyword for different URL with exception');
      logInfo(`Error message: ${error.message}`);
      results.passedTests++;
    }
    
    // Test 2.2: Attempt to create duplicate keyword for same URL
    logHeader('TEST 2.2: Duplicate Keyword for Same URL');
    results.totalTests++;
    
    try {
      const sameUrlResult = await client.createCustomUrl(validUrl, validKeyword);
      console.log('Result:', JSON.stringify(sameUrlResult, null, 2));
      
      if (sameUrlResult && sameUrlResult.status === 'success') {
        logSuccess('Successfully handled duplicate keyword for same URL - returns success');
        results.passedTests++;
      } else {
        logError('Failed to handle duplicate keyword for same URL correctly');
        results.failedTests++;
      }
    } catch (error) {
      logError('Failed to handle duplicate keyword for same URL correctly - threw exception');
      logInfo(`Error message: ${error.message}`);
      results.failedTests++;
    }
    
    logHeader('SECTION 3: Plugin Approach Tests');
    
    // Test 3.1: Missing force parameter
    logHeader('TEST 3.1: Plugin Approach without Force Parameter');
    results.totalTests++;
    
    try {
      // Directly make API request without force parameter
      const noForceResult = await client.makeRequest('shorturl', {
        url: validUrl,
        keyword: `${baseKeyword}${keywordCounter++}`
      });
      
      console.log('Result:', JSON.stringify(noForceResult, null, 2));
      
      // This is expected to fail for URL uniqueness if the plugin is correctly requiring force=1
      if (!noForceResult || noForceResult.status === 'error' || noForceResult.status === 'fail') {
        logSuccess('Plugin correctly requires force=1 parameter');
        results.passedTests++;
      } else if (noForceResult.status === 'success' && noForceResult.shorturl.includes(validKeyword)) {
        logWarning('Duplicate URL created without force=1 - your YOURLS may have YOURLS_UNIQUE_URLS=false');
        results.passedTests++; // Still counts as expected behavior
      } else {
        logError('Unexpected behavior when testing force parameter');
        results.failedTests++;
      }
    } catch (error) {
      logSuccess('Plugin correctly requires force=1 parameter - threw exception');
      logInfo(`Error message: ${error.message}`);
      results.passedTests++;
    }
    
    logHeader('SECTION 4: URL Modification Approach Tests');
    
    // Test 4.1: URL with existing timestamp parameter
    logHeader('TEST 4.1: URL Already Has _t Parameter');
    results.totalTests++;
    
    const urlWithTimestamp = `https://example.com/test?_t=${Date.now()}`;
    
    try {
      const timestampResult = await client.createCustomUrl(urlWithTimestamp, `${baseKeyword}${keywordCounter++}`, null, false, true);
      console.log('Result:', JSON.stringify(timestampResult, null, 2));
      
      if (timestampResult && timestampResult.status === 'success') {
        logSuccess('Successfully handled URL that already has _t parameter');
        results.passedTests++;
      } else {
        logError('Failed to handle URL with existing _t parameter');
        results.failedTests++;
      }
    } catch (error) {
      logError('Failed to handle URL with existing _t parameter - threw exception');
      logInfo(`Error message: ${error.message}`);
      results.failedTests++;
    }
    
    // Test 4.2: URL with lots of existing parameters
    logHeader('TEST 4.2: URL with Many Parameters');
    results.totalTests++;
    
    const urlWithManyParams = `https://example.com/test?param1=value1&param2=value2&param3=value3&param4=value4&param5=value5`;
    
    try {
      const manyParamsResult = await client.createCustomUrl(urlWithManyParams, `${baseKeyword}${keywordCounter++}`, null, false, true);
      console.log('Result:', JSON.stringify(manyParamsResult, null, 2));
      
      if (manyParamsResult && manyParamsResult.status === 'success') {
        logSuccess('Successfully handled URL with many parameters');
        results.passedTests++;
      } else {
        logError('Failed to handle URL with many parameters');
        results.failedTests++;
      }
    } catch (error) {
      logError('Failed to handle URL with many parameters - threw exception');
      logInfo(`Error message: ${error.message}`);
      results.failedTests++;
    }
    
    logHeader('SECTION 5: MCP Error Handling Tests');
    
    // Test 5.1: MCP with invalid URL
    logHeader('TEST 5.1: MCP with Invalid URL');
    results.totalTests++;
    
    const mcpInvalidUrlResult = await mcpServer.handleExecute({
      tool: 'create_custom_url',
      params: {
        url: 'not-a-valid-url',
        keyword: `${baseKeyword}${keywordCounter++}`,
        force_url_modification: false
      }
    });
    
    console.log('MCP Result:', JSON.stringify(mcpInvalidUrlResult, null, 2));
    
    if (mcpInvalidUrlResult && isErrorResponse(mcpInvalidUrlResult)) {
      logSuccess('MCP properly rejected invalid URL');
      logInfo(`Error message: ${extractErrorMessage(mcpInvalidUrlResult)}`);
      results.passedTests++;
    } else {
      logError('MCP failed to reject invalid URL');
      results.failedTests++;
    }
    
    // Test 5.2: MCP with duplicate keyword
    logHeader('TEST 5.2: MCP with Duplicate Keyword');
    results.totalTests++;
    
    const mcpDuplicateResult = await mcpServer.handleExecute({
      tool: 'create_custom_url',
      params: {
        url: 'https://example.com/different-page',
        keyword: validKeyword, // This keyword already exists
        force_url_modification: false
      }
    });
    
    console.log('MCP Result:', JSON.stringify(mcpDuplicateResult, null, 2));
    
    if (mcpDuplicateResult && isErrorResponse(mcpDuplicateResult)) {
      logSuccess('MCP properly rejected duplicate keyword for different URL');
      logInfo(`Error message: ${extractErrorMessage(mcpDuplicateResult)}`);
      results.passedTests++;
    } else {
      logError('MCP failed to reject duplicate keyword for different URL');
      results.failedTests++;
    }
    
    // Test 5.3: MCP falling back from plugin to URL modification
    logHeader('TEST 5.3: MCP Fallback Mechanism');
    results.totalTests++;
    
    // Create a new short URL using the same destination URL but different keyword
    const fallbackResult = await mcpServer.handleExecute({
      tool: 'create_custom_url',
      params: {
        url: validUrl,
        keyword: `${baseKeyword}${keywordCounter++}`,
        force_url_modification: false // Let it try the plugin first
      }
    });
    
    console.log('MCP Result:', JSON.stringify(fallbackResult, null, 2));
    
    if (fallbackResult && !isErrorResponse(fallbackResult)) {
      logSuccess('MCP successfully created duplicate URL (either using plugin or falling back)');
      results.passedTests++;
    } else {
      logError('MCP failed to create duplicate URL with either approach');
      logInfo(`Error message: ${extractErrorMessage(fallbackResult)}`);
      results.failedTests++;
    }
    
    // Results summary
    logHeader('TEST RESULTS SUMMARY');
    
    console.log(`Total tests: ${results.totalTests}`);
    console.log(`Passed: ${colors.green}${results.passedTests}${colors.reset}`);
    console.log(`Failed: ${results.failedTests > 0 ? colors.red + results.failedTests + colors.reset : '0'}`);
    console.log(`Success rate: ${Math.round((results.passedTests / results.totalTests) * 100)}%`);
    console.log('\n');
    
    if (results.passedTests === results.totalTests) {
      logSuccess('All error handling tests passed!');
    } else {
      logWarning(`${results.failedTests} tests failed. Review the output above for details.`);
    }
    
  } catch (error) {
    console.error('Test suite failed with error:', error);
  }
}

// Run the error tests
runErrorTests().catch(error => {
  console.error('Fatal error:', error);
});