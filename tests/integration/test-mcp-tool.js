/**
 * Test script for using the create_custom_url MCP tool
 */
import { MCPServer } from '@modelcontextprotocol/sdk';
import YourlsClient from '../../../src/api.js';
import { registerTools } from '../../../src/tools/index.js';

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
const yourlsClient = new YourlsClient(config);

// Create an MCP server
const server = new MCPServer({
  name: 'YOURLS-MCP',
  version: '1.0.0'
});

// Register all tools with the server
registerTools(server, yourlsClient);

// Function to simulate using the MCP tool
async function testCreateCustomUrl() {
  try {
    console.log('Testing create_custom_url MCP tool...');
    
    // Generate a unique test URL and keyword
    const timestamp = Date.now();
    const testUrl = `https://example.com/test-${timestamp}`;
    const testKeyword = `test-${timestamp.toString().substring(8)}`;
    
    console.log(`Test URL: ${testUrl}`);
    console.log(`Test Keyword: ${testKeyword}`);
    
    // Call the tool directly (normally this would be done through the MCP server)
    const tools = server.getTools();
    const createCustomUrlTool = tools.find(tool => tool.name === 'create_custom_url');
    
    if (!createCustomUrlTool) {
      throw new Error('create_custom_url tool not found');
    }
    
    // Execute the tool with force_url_modification=true
    console.log('Executing tool with force_url_modification=true...');
    const result = await createCustomUrlTool.execute({
      url: testUrl,
      keyword: testKeyword,
      force_url_modification: true
    });
    
    // Parse the JSON result
    const jsonResult = JSON.parse(result.content);
    
    console.log('Result:');
    console.log(JSON.stringify(jsonResult, null, 2));
    
    if (jsonResult.status === 'success') {
      console.log(`✅ Success! Created short URL: ${jsonResult.shorturl}`);
      console.log(`Original URL: ${jsonResult.url}`);
      
      if (jsonResult.internal_url) {
        console.log(`Modified URL stored in YOURLS: ${jsonResult.internal_url}`);
      }
    } else {
      console.log(`❌ Failed: ${jsonResult.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Test failed with error:');
    console.error(error);
  }
}

// Run the test
testCreateCustomUrl();