/**
 * Test to verify standardized response format from MCP tools
 */
import { createServer } from '../../src/index.js';

// Helper function to check response format
function validateResponseFormat(response, isSuccess) {
  // Check that we have a content array
  if (!Array.isArray(response.content)) {
    throw new Error('Response missing content array');
  }
  
  // Check that first content item is text
  if (!response.content[0] || response.content[0].type !== 'text') {
    throw new Error('Response content[0] is not type "text"');
  }
  
  // Parse the response
  let parsedContent;
  try {
    parsedContent = JSON.parse(response.content[0].text);
  } catch (error) {
    throw new Error('Response content is not valid JSON');
  }
  
  // Check status field
  if (isSuccess && parsedContent.status !== 'success') {
    throw new Error(`Expected success status but got: ${parsedContent.status}`);
  }
  
  if (!isSuccess && parsedContent.status !== 'error') {
    throw new Error(`Expected error status but got: ${parsedContent.status}`);
  }
  
  // Check error flag
  if (isSuccess && response.isError === true) {
    throw new Error('Success response should not have isError flag');
  }
  
  if (!isSuccess && response.isError !== true) {
    throw new Error('Error response should have isError flag');
  }
  
  return true;
}

async function runTests() {
  console.log('Testing standardized response format...');
  
  // Import tool creators directly
  console.log('Creating mock tools...');
  
  // Import tool creators from src/tools
  import createShortenUrlTool from '../../src/tools/shortenUrl.js';
  import createExpandUrlTool from '../../src/tools/expandUrl.js';
  import createDbStatsTool from '../../src/tools/dbStats.js';
  
  // Mock YOURLS client
  const mockYourlsClient = {
    shorten: async () => ({ shorturl: 'https://example.com/abc', url: 'https://example.com', title: 'Example' }),
    expand: async () => ({ longurl: 'https://example.com', shorturl: 'https://example.com/abc', title: 'Example' }),
    dbStats: async () => ({ 'db-stats': { total_links: 100, total_clicks: 500 } })
  };
  
  // Create tool instances directly
  const shortenTool = createShortenUrlTool(mockYourlsClient);
  const expandTool = createExpandUrlTool(mockYourlsClient);
  const dbStatsTool = createDbStatsTool(mockYourlsClient);
  
  // Test success responses
  console.log('Testing success responses...');
  const shortenResponse = await shortenTool.execute({ url: 'https://example.com' });
  validateResponseFormat(shortenResponse, true);
  console.log('✓ shortenUrl success response is valid');
  
  // Test expandUrl
  const expandTool = server._tools.find(t => t.name === 'expand_url');
  const expandResponse = await expandTool.execute({ shorturl: 'abc' });
  validateResponseFormat(expandResponse, true);
  console.log('✓ expandUrl success response is valid');
  
  // Test dbStats
  const dbStatsTool = server._tools.find(t => t.name === 'db_stats');
  const dbStatsResponse = await dbStatsTool.execute({});
  validateResponseFormat(dbStatsResponse, true);
  console.log('✓ dbStats success response is valid');
  
  // Test error responses
  console.log('\nTesting error responses...');
  
  // Create new tool instances with error-throwing mock client
  const errorClient = {
    shorten: async () => { throw new Error('Test error'); },
    expand: async () => { throw new Error('Test error'); },
    dbStats: async () => { throw new Error('Test error'); }
  };
  
  // Create new tool instances with error client
  const shortenErrorTool = createShortenUrlTool(errorClient);
  const expandErrorTool = createExpandUrlTool(errorClient);
  const dbStatsErrorTool = createDbStatsTool(errorClient);
  
  // Test shortenUrl error
  const shortenErrorResponse = await shortenErrorTool.execute({ url: 'https://example.com' });
  validateResponseFormat(shortenErrorResponse, false);
  console.log('✓ shortenUrl error response is valid');
  
  // Test expandUrl error
  const expandErrorResponse = await expandErrorTool.execute({ shorturl: 'abc' });
  validateResponseFormat(expandErrorResponse, false);
  console.log('✓ expandUrl error response is valid');
  
  // Test dbStats error
  const dbStatsErrorResponse = await dbStatsErrorTool.execute({});
  validateResponseFormat(dbStatsErrorResponse, false);
  console.log('✓ dbStats error response is valid');
  
  console.log('\n✅ All responses conform to standardized format');
}

// Run the tests
runTests().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});