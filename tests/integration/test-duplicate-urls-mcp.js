/**
 * Test script for YOURLS-MCP duplicate URL handling through the MCP API
 * 
 * This file demonstrates how Claude can use the create_custom_url tool to create multiple
 * short URLs for the same destination URL.
 */
import { createServer } from '../../../src/index.js';
import YourlsClient from '../../../src/api.js';

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

// Simulate Claude making requests through MCP
// This demonstrates how Claude would use the MCP tools to create duplicate URLs
async function testMcpTools() {
  console.log('=== YOURLS-MCP Duplicate URL Handling Test (MCP API) ===');
  
  try {
    // Generate unique test parameters
    const testUrl = 'https://example.com/test-page';
    const keyword1 = 'test1' + Date.now().toString().substring(8);
    const keyword2 = 'test2' + Date.now().toString().substring(8);
    const keyword3 = 'test3' + Date.now().toString().substring(8);
    
    console.log(`Test URL: ${testUrl}`);
    console.log(`Keywords: ${keyword1}, ${keyword2}, ${keyword3}`);
    console.log('\n');
    
    // 1. First, create a regular short URL to establish a baseline
    console.log('=== TEST 1: Creating first short URL (using shorten_url tool) ===');
    const shortResult = await mcpServer.handleExecute({
      tool: 'shorten_url',
      params: {
        url: testUrl,
        keyword: keyword1
      }
    });
    
    console.log('Result:', shortResult?.content || 'Error: No result');
    console.log('\n');
    
    // 2. Now try to create a duplicate URL with the custom plugin approach
    console.log('=== TEST 2: Creating duplicate URL with plugin approach (using create_custom_url tool) ===');
    const customResult = await mcpServer.handleExecute({
      tool: 'create_custom_url',
      params: {
        url: testUrl,
        keyword: keyword2,
        force_url_modification: false
      }
    });
    
    console.log('Result:', customResult?.content || 'Error: No result');
    console.log('\n');
    
    // 3. Finally, create another duplicate URL with the URL modification approach
    console.log('=== TEST 3: Creating duplicate URL with URL modification approach (using create_custom_url tool) ===');
    const modifiedResult = await mcpServer.handleExecute({
      tool: 'create_custom_url',
      params: {
        url: testUrl,
        keyword: keyword3,
        force_url_modification: true
      }
    });
    
    console.log('Result:', modifiedResult?.content || 'Error: No result');
    console.log('\n');
    
    // Now verify the URLs using the expand_url tool
    console.log('=== VERIFICATION ===');
    
    // Verify first URL
    const expand1 = await mcpServer.handleExecute({
      tool: 'expand_url',
      params: {
        shorturl: keyword1
      }
    });
    console.log(`Verify ${keyword1}:`, expand1?.content || 'Error: No result');
    
    // Verify second URL (plugin approach)
    const expand2 = await mcpServer.handleExecute({
      tool: 'expand_url',
      params: {
        shorturl: keyword2
      }
    });
    console.log(`Verify ${keyword2}:`, expand2?.content || 'Error: No result');
    
    // Verify third URL (URL modification approach)
    const expand3 = await mcpServer.handleExecute({
      tool: 'expand_url',
      params: {
        shorturl: keyword3
      }
    });
    console.log(`Verify ${keyword3}:`, expand3?.content || 'Error: No result');
    
    // Print summary for Claude's reference
    console.log('\n=== SUMMARY ===');
    console.log(`This test demonstrates how Claude can create multiple short URLs for the same destination URL using the create_custom_url tool with different parameters.`);
    console.log(`There are two methods supported:`);
    console.log(`1. Plugin Approach: Using the Force Allow Duplicates plugin with force=1 parameter`);
    console.log(`   Usage: params: { url, keyword, force_url_modification: false }`);
    console.log(`2. URL Modification Approach: Adding timestamp parameters to make URLs unique in the database`);
    console.log(`   Usage: params: { url, keyword, force_url_modification: true }`);
    console.log('\nBoth methods appear in the API as normal short URLs to the user, but the URL modification approach adds a timestamp parameter to the stored URL.');
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Start the test
testMcpTools().catch(console.error);