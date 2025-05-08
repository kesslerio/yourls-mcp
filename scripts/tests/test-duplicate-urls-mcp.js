/**
 * Comprehensive test script for YOURLS-MCP duplicate URL handling through the MCP API
 * 
 * This file demonstrates how Claude can use the MCP tools to create multiple
 * short URLs for the same destination URL and tests various advanced scenarios.
 */
import { createServer } from '../../src/index.js';
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

// Set up an MCP server
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

// Helper function to extract URL from content
function extractUrlFromContent(content) {
  if (!content || !Array.isArray(content)) return null;
  
  // Find the text content that contains a URL
  for (const item of content) {
    if (item.type === 'text' && item.text && typeof item.text === 'string') {
      // Look for https:// or http:// in the text
      if (item.text.includes('http')) {
        const urlMatch = item.text.match(/(https?:\/\/[^\s]+)/);
        if (urlMatch) return urlMatch[1];
      }
    }
  }
  
  return null;
}

// Helper function to extract expanded URL from content
function extractExpandedUrlFromContent(content) {
  if (!content || !Array.isArray(content)) return null;
  
  // Look for specific patterns in the response content
  for (const item of content) {
    if (item.type === 'text' && item.text && typeof item.text === 'string') {
      // Look for "expands to" or "Original URL:" in the text
      if (item.text.includes('expands to') || item.text.includes('Original URL:') || item.text.includes('points to')) {
        const urlMatch = item.text.match(/(https?:\/\/[^\s]+)/);
        if (urlMatch) return urlMatch[1];
      }
    }
  }
  
  return null;
}

// Helper function to sanitize JSON for display in console output
function sanitizeForDisplay(obj, maxLength = 500) {
  if (!obj) return 'undefined';
  
  const str = JSON.stringify(obj, null, 2);
  if (str.length <= maxLength) return str;
  
  return str.substring(0, maxLength) + '... (truncated)';
}

// Comprehensive test suite for MCP tools
async function testMcpTools() {
  console.log(`${colors.bright}${colors.magenta}YOURLS-MCP Duplicate URL Handling Comprehensive Test Suite (MCP API)${colors.reset}`);
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
    modificationWorking: false,
    mcpToolsWorking: {
      shorten_url: false,
      create_custom_url: false,
      expand_url: false
    }
  };
  
  // Test URLs and parameters
  const timestamp = Date.now().toString().substring(8);
  const testUrl = 'https://example.com/test-page';
  const testUrlWithParams = 'https://example.com/test-page?param1=value1&param2=value2';
  const testUrlWithFragment = 'https://example.com/test-page#section1';
  const testUrlWithParamsAndFragment = 'https://example.com/test-page?param1=value1#section1';
  
  // Generate unique keywords for each test
  const keyword1 = 'mcp1' + timestamp;
  const keyword2 = 'mcp2' + timestamp;
  const keyword3 = 'mcp3' + timestamp;
  const keyword4 = 'mcp4' + timestamp;
  const keyword5 = 'mcp5' + timestamp;
  const keyword6 = 'mcp6' + timestamp;
  const keyword7 = 'mcp7' + timestamp;
  const keyword8 = 'mcp8' + timestamp;
  
  try {
    // SECTION 1: Basic Functionality Tests
    logHeader('SECTION 1: Basic MCP Tool Functionality Tests');
    
    // Test 1.1: Verify shorten_url tool works (baseline)
    logHeader('TEST 1.1: Basic Shortening with shorten_url Tool');
    results.totalTests++;
    console.log(`Target URL: ${testUrl}`);
    console.log(`Keyword: ${keyword1}`);
    
    const test1 = await mcpServer.handleExecute({
      tool: 'shorten_url',
      params: {
        url: testUrl,
        keyword: keyword1
      }
    });
    
    console.log('Result:', sanitizeForDisplay(test1?.content));
    
    if (test1 && test1.content && extractUrlFromContent(test1.content)) {
      logSuccess(`Short URL created successfully with keyword: ${keyword1}`);
      results.mcpToolsWorking.shorten_url = true;
      results.passedTests++;
    } else {
      logError(`Failed to create short URL with shorten_url tool`);
      logError('This is a critical failure - the basic MCP functionality is not working');
      results.failedTests++;
      return; // Stop tests if basic functionality fails
    }
    
    // Test 1.2: Verify create_custom_url tool works
    logHeader('TEST 1.2: Basic create_custom_url Tool Test');
    results.totalTests++;
    console.log(`Target URL: ${testUrlWithParams}`);
    console.log(`Keyword: ${keyword4}`);
    
    const test2 = await mcpServer.handleExecute({
      tool: 'create_custom_url',
      params: {
        url: testUrlWithParams,
        keyword: keyword4,
        title: 'Test URL with Parameters'
      }
    });
    
    console.log('Result:', sanitizeForDisplay(test2?.content));
    
    if (test2 && test2.content && extractUrlFromContent(test2.content)) {
      logSuccess(`Short URL created successfully with create_custom_url tool and keyword: ${keyword4}`);
      results.mcpToolsWorking.create_custom_url = true;
      results.passedTests++;
    } else {
      logError(`Failed to create short URL with create_custom_url tool`);
      logError('This is a critical failure - the create_custom_url tool is not working');
      results.failedTests++;
      return; // Stop tests if basic functionality fails
    }
    
    // Test 1.3: Verify expand_url tool works
    logHeader('TEST 1.3: Basic expand_url Tool Test');
    results.totalTests++;
    console.log(`Keyword to expand: ${keyword1}`);
    
    const test3 = await mcpServer.handleExecute({
      tool: 'expand_url',
      params: {
        shorturl: keyword1
      }
    });
    
    console.log('Result:', sanitizeForDisplay(test3?.content));
    
    if (test3 && test3.content && extractExpandedUrlFromContent(test3.content)) {
      logSuccess(`URL expanded successfully with expand_url tool`);
      results.mcpToolsWorking.expand_url = true;
      results.passedTests++;
    } else {
      logError(`Failed to expand URL with expand_url tool`);
      logError('This is a critical failure - the expand_url tool is not working');
      results.failedTests++;
      return; // Stop tests if basic functionality fails
    }
    
    // SECTION 2: Duplicate URL Handling Tests
    logHeader('SECTION 2: Duplicate URL Handling Tests');
    
    // Test 2.1: Create duplicate URL with plugin approach
    logHeader('TEST 2.1: Create Duplicate URL with Plugin Approach');
    results.totalTests++;
    console.log(`Target URL: ${testUrl} (same as Test 1.1)`);
    console.log(`Keyword: ${keyword2}`);
    
    const pluginTest = await mcpServer.handleExecute({
      tool: 'create_custom_url',
      params: {
        url: testUrl,
        keyword: keyword2,
        force_url_modification: false
      }
    });
    
    console.log('Result:', sanitizeForDisplay(pluginTest?.content));
    
    if (pluginTest && pluginTest.content && extractUrlFromContent(pluginTest.content)) {
      logSuccess(`Duplicate URL created successfully with plugin approach using keyword: ${keyword2}`);
      results.pluginWorking = true;
      results.passedTests++;
    } else {
      logWarning(`Plugin approach failed - the Force Allow Duplicates plugin might not be installed`);
      logInfo('Continuing with URL modification approach tests...');
      results.failedTests++;
    }
    
    // Test 2.2: Create duplicate URL with URL modification approach
    logHeader('TEST 2.2: Create Duplicate URL with URL Modification Approach');
    results.totalTests++;
    console.log(`Target URL: ${testUrl} (same as previous tests)`);
    console.log(`Keyword: ${keyword3}`);
    
    const modificationTest = await mcpServer.handleExecute({
      tool: 'create_custom_url',
      params: {
        url: testUrl,
        keyword: keyword3,
        force_url_modification: true
      }
    });
    
    console.log('Result:', sanitizeForDisplay(modificationTest?.content));
    
    if (modificationTest && modificationTest.content && extractUrlFromContent(modificationTest.content)) {
      logSuccess(`Duplicate URL created successfully with URL modification using keyword: ${keyword3}`);
      results.modificationWorking = true;
      results.passedTests++;
    } else {
      logError(`URL modification approach failed`);
      results.failedTests++;
    }
    
    // Test 2.3: Create URL with different formatting (URL with fragment)
    logHeader('TEST 2.3: Create URL with Fragment Using Plugin Approach');
    results.totalTests++;
    console.log(`Target URL: ${testUrlWithFragment}`);
    console.log(`Keyword: ${keyword5}`);
    
    const fragmentTest = await mcpServer.handleExecute({
      tool: 'create_custom_url',
      params: {
        url: testUrlWithFragment,
        keyword: keyword5,
        force_url_modification: false
      }
    });
    
    console.log('Result:', sanitizeForDisplay(fragmentTest?.content));
    
    if (fragmentTest && fragmentTest.content && extractUrlFromContent(fragmentTest.content)) {
      logSuccess(`URL with fragment created successfully using keyword: ${keyword5}`);
      results.passedTests++;
    } else {
      logError(`Failed to create URL with fragment`);
      results.failedTests++;
    }
    
    // Test 2.4: Create duplicate URL with complex URL (params and fragment)
    logHeader('TEST 2.4: Create URL with Complex Format Using URL Modification');
    results.totalTests++;
    console.log(`Target URL: ${testUrlWithParamsAndFragment}`);
    console.log(`Keyword: ${keyword6}`);
    
    const complexTest = await mcpServer.handleExecute({
      tool: 'create_custom_url',
      params: {
        url: testUrlWithParamsAndFragment,
        keyword: keyword6,
        force_url_modification: true
      }
    });
    
    console.log('Result:', sanitizeForDisplay(complexTest?.content));
    
    if (complexTest && complexTest.content && extractUrlFromContent(complexTest.content)) {
      logSuccess(`Complex URL created successfully using keyword: ${keyword6}`);
      results.passedTests++;
    } else {
      logError(`Failed to create complex URL`);
      results.failedTests++;
    }
    
    // Test 2.5: Create duplicate of an existing URL (exact duplicate handling)
    logHeader('TEST 2.5: Create Duplicate of Existing URL');
    results.totalTests++;
    console.log(`Target URL: ${testUrl} (same as Test 1.1)`);
    console.log(`Keyword: ${keyword7}`);
    
    const duplicateTest = await mcpServer.handleExecute({
      tool: 'create_custom_url',
      params: {
        url: testUrl,
        keyword: keyword7,
        force_url_modification: false
      }
    });
    
    console.log('Result:', sanitizeForDisplay(duplicateTest?.content));
    
    if (duplicateTest && duplicateTest.content && extractUrlFromContent(duplicateTest.content)) {
      logSuccess(`Another duplicate URL created successfully using keyword: ${keyword7}`);
      results.passedTests++;
    } else {
      logError(`Failed to create another duplicate URL`);
      results.failedTests++;
    }
    
    // Test 2.6: Create duplicate with optional title parameter
    logHeader('TEST 2.6: Create Duplicate URL with Title Parameter');
    results.totalTests++;
    console.log(`Target URL: ${testUrl} (same as previous tests)`);
    console.log(`Keyword: ${keyword8}`);
    console.log(`Title: "Test Title with Special Characters: &<>"`);
    
    const titleTest = await mcpServer.handleExecute({
      tool: 'create_custom_url',
      params: {
        url: testUrl,
        keyword: keyword8,
        title: 'Test Title with Special Characters: &<>"',
        force_url_modification: true
      }
    });
    
    console.log('Result:', sanitizeForDisplay(titleTest?.content));
    
    if (titleTest && titleTest.content && extractUrlFromContent(titleTest.content)) {
      logSuccess(`Duplicate URL with title created successfully using keyword: ${keyword8}`);
      results.passedTests++;
    } else {
      logError(`Failed to create duplicate URL with title`);
      results.failedTests++;
    }
    
    // SECTION 3: Verification Tests
    logHeader('SECTION 3: Verification Tests');
    
    // Create an array of all keywords to verify
    const keywordsToVerify = [
      { keyword: keyword1, url: testUrl, description: 'First URL (regular shorten_url tool)' },
      { keyword: keyword2, url: testUrl, description: 'Second URL (plugin approach)' },
      { keyword: keyword3, url: testUrl, description: 'Third URL (URL modification approach)' },
      { keyword: keyword4, url: testUrlWithParams, description: 'URL with query parameters' },
      { keyword: keyword5, url: testUrlWithFragment, description: 'URL with fragment' },
      { keyword: keyword6, url: testUrlWithParamsAndFragment, description: 'Complex URL with params and fragment' },
      { keyword: keyword7, url: testUrl, description: 'Another duplicate URL' },
      { keyword: keyword8, url: testUrl, description: 'Duplicate URL with title' }
    ];
    
    // Verify each keyword
    for (let i = 0; i < keywordsToVerify.length; i++) {
      const item = keywordsToVerify[i];
      results.totalTests++;
      
      logHeader(`VERIFICATION ${i+1}: ${item.description} (${item.keyword})`);
      
      const expandResult = await mcpServer.handleExecute({
        tool: 'expand_url',
        params: {
          shorturl: item.keyword
        }
      });
      
      console.log('Result:', sanitizeForDisplay(expandResult?.content));
      
      const expandedUrl = extractExpandedUrlFromContent(expandResult?.content);
      if (expandedUrl) {
        // Check if the expanded URL matches the expected URL
        // For URL modification approach, the expanded URL should at least start with the expected URL
        if (expandedUrl === item.url || expandedUrl.startsWith(item.url + '?_t=') || expandedUrl.startsWith(item.url + '&_t=')) {
          logSuccess(`Verification successful - ${item.keyword} expands to the expected URL`);
          results.passedTests++;
        } else {
          logError(`Verification failed - ${item.keyword} expands to an unexpected URL`);
          logInfo(`Expected: ${item.url}`);
          logInfo(`Actual: ${expandedUrl}`);
          results.failedTests++;
        }
      } else {
        logError(`Failed to expand ${item.keyword}`);
        results.failedTests++;
      }
    }
    
    // SECTION 4: Error Handling Tests
    logHeader('SECTION 4: Error Handling Tests');
    
    // Test 4.1: Attempt to create URL with existing keyword
    logHeader('TEST 4.1: Attempt to Create URL with Existing Keyword');
    results.totalTests++;
    
    const errorTest1 = await mcpServer.handleExecute({
      tool: 'create_custom_url',
      params: {
        url: 'https://example.org/different-page',
        keyword: keyword1, // This keyword already exists
        force_url_modification: false
      }
    });
    
    console.log('Result:', sanitizeForDisplay(errorTest1?.content));
    
    // Check if the response properly indicates an error
    if (errorTest1 && errorTest1.content && 
        (errorTest1.content.some(item => 
          item.type === 'text' && 
          (item.text.includes('already exists') || item.text.includes('already taken') || item.text.includes('error'))
        ))) {
      logSuccess('Error handling works correctly for existing keyword');
      results.passedTests++;
    } else {
      logError('Error handling failed for existing keyword');
      results.failedTests++;
    }
    
    // Test 4.2: Attempt with invalid URL format
    logHeader('TEST 4.2: Attempt with Invalid URL Format');
    results.totalTests++;
    
    const errorTest2 = await mcpServer.handleExecute({
      tool: 'create_custom_url',
      params: {
        url: 'not-a-valid-url',
        keyword: 'invalid' + timestamp,
        force_url_modification: false
      }
    });
    
    console.log('Result:', sanitizeForDisplay(errorTest2?.content));
    
    // Check if the response properly indicates an error
    if (errorTest2 && errorTest2.content && 
        (errorTest2.content.some(item => 
          item.type === 'text' && 
          (item.text.includes('invalid') || item.text.includes('format') || item.text.includes('error'))
        ))) {
      logSuccess('Error handling works correctly for invalid URL format');
      results.passedTests++;
    } else {
      logError('Error handling failed for invalid URL format');
      results.failedTests++;
    }
    
    // SECTION 5: Results Summary
    logHeader('TEST RESULTS SUMMARY');
    
    console.log(`Total tests: ${results.totalTests}`);
    console.log(`Passed: ${colors.green}${results.passedTests}${colors.reset}`);
    console.log(`Failed: ${results.failedTests > 0 ? colors.red + results.failedTests + colors.reset : '0'}`);
    console.log(`Success rate: ${Math.round((results.passedTests / results.totalTests) * 100)}%`);
    console.log('\n');
    
    console.log('MCP Tools Status:');
    Object.entries(results.mcpToolsWorking).forEach(([tool, working]) => {
      if (working) {
        logSuccess(`${tool}: WORKING`);
      } else {
        logError(`${tool}: NOT WORKING`);
      }
    });
    
    console.log('\nDuplicate URL Approach Status:');
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
    
    // Reference guide for Claude
    logHeader('REFERENCE GUIDE FOR CLAUDE');
    
    console.log(`This test demonstrates how Claude can create multiple short URLs for the same destination URL using the MCP tools.`);
    console.log('\nMCP Tool Usage:');
    
    console.log(`\n1. Basic short URL creation:`);
    console.log(`mcpServer.handleExecute({
  tool: 'shorten_url',
  params: {
    url: 'https://example.com',
    keyword: 'example'
  }
});`);
    
    console.log(`\n2. Create duplicate URL with plugin approach (preferred when available):`);
    console.log(`mcpServer.handleExecute({
  tool: 'create_custom_url',
  params: {
    url: 'https://example.com',
    keyword: 'example2',
    force_url_modification: false
  }
});`);
    
    console.log(`\n3. Create duplicate URL with URL modification approach (works even without plugin):`);
    console.log(`mcpServer.handleExecute({
  tool: 'create_custom_url',
  params: {
    url: 'https://example.com',
    keyword: 'example3',
    force_url_modification: true
  }
});`);
    
    console.log(`\n4. Expand a short URL:`);
    console.log(`mcpServer.handleExecute({
  tool: 'expand_url',
  params: {
    shorturl: 'example'
  }
});`);
    
    console.log('\nWhen working with the URL, Claude should:');
    console.log('1. Present the original URL to the user (not the modified URL with timestamp)');
    console.log('2. Try the plugin approach first unless explicitly asked to use URL modification');
    console.log('3. Handle errors appropriately, especially for duplicate keywords');
    console.log('4. Allow the user to specify titles for their short URLs');
    
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Start the test
testMcpTools().catch(console.error);