# YOURLS-MCP Implementation Guide

This document provides detailed implementation guidance for the YOURLS-MCP project, focusing on best practices and common patterns.

## Duplicate URL Handling

### How to Use in Your Code

When you need to create multiple short URLs for the same destination URL:

#### Using the JavaScript Client Directly

```javascript
import YourlsClient from './src/api.js';

const client = new YourlsClient({
  api_url: 'https://your-yourls-domain.com/yourls-api.php',
  auth_method: 'signature',
  signature_token: 'your-signature-token'
});

// Create the first short URL normally
const result1 = await client.shorten('https://example.com', 'keyword1');

// Create a second short URL for the same destination using the custom plugin approach
const result2 = await client.createCustomUrl('https://example.com', 'keyword2', 'Optional Title', false, false);

// Create a third short URL using the URL modification approach
const result3 = await client.createCustomUrl('https://example.com', 'keyword3', 'Optional Title', false, true);
```

#### Using MCP Tools

```javascript
// Claude can use this pattern to create multiple short URLs for the same destination

// First URL
const shortResult = await mcpServer.handleExecute({
  tool: 'shorten_url',
  params: {
    url: 'https://example.com',
    keyword: 'keyword1'
  }
});

// Second URL with plugin approach
const pluginResult = await mcpServer.handleExecute({
  tool: 'create_custom_url',
  params: {
    url: 'https://example.com',
    keyword: 'keyword2',
    force_url_modification: false
  }
});

// Third URL with URL modification approach
const modificationResult = await mcpServer.handleExecute({
  tool: 'create_custom_url',
  params: {
    url: 'https://example.com',
    keyword: 'keyword3',
    force_url_modification: true
  }
});
```

### Implementation Details

The `createCustomUrl` method follows this decision tree:

1. Check if the keyword already exists
   - If it exists and points to the same URL, return success
   - If it exists and points to a different URL, return error

2. If the keyword doesn't exist:
   - If `forceUrlModification` is true, skip to step 3
   - If not, try the plugin approach with `force=1` parameter
   - If the plugin approach works, return success

3. If the plugin approach fails or was skipped:
   - Modify the URL by adding a timestamp parameter
   - Create a short URL with the modified URL
   - Return a customized response with both the original and modified URLs

## Best Practices

### Error Handling

All API operations have comprehensive error handling:

```javascript
try {
  const result = await client.createCustomUrl(url, keyword);
  // Handle success
} catch (error) {
  // Special handling for specific error types
  if (error.message && error.message.includes('already exists')) {
    // Handle duplicate keyword error
  } else if (isShortShortError(error)) {
    // Handle ShortShort plugin error
  } else {
    // Handle other errors
  }
}
```

### Plugin Detection and Fallbacks

The system automatically detects available plugins:

```javascript
// Check if a plugin is available before using it
const isPluginAvailable = await isPluginAvailable(client, 'pluginKey', 'testAction', { param: 'value' });

if (isPluginAvailable) {
  // Use the plugin-specific functionality
} else if (useNativeFallback) {
  // Use the fallback implementation
} else {
  // Report that the plugin is required
}
```

### URL Validation

Always validate URLs before processing:

```javascript
import { validateUrl } from './utils.js';

// Validate URL format
try {
  validateUrl(url);
} catch (error) {
  // Handle invalid URL
  return createApiResponse(false, {
    message: error.message,
    code: 'error:invalid_url'
  });
}
```

## Testing

### Unit Testing

Test individual components with mocked dependencies:

```javascript
// Mock the YOURLS API response
const mockClient = {
  shorten: jest.fn().mockResolvedValue({ status: 'success', shorturl: 'https://example.com/abc' }),
  createCustomUrl: jest.fn().mockResolvedValue({ status: 'success', shorturl: 'https://example.com/def' })
};

// Test the tool with the mock client
const result = await createShortenUrlTool(mockClient).execute({ url: 'https://example.com', keyword: 'test' });
expect(result.content).toContain('success');
```

### Integration Testing

Test the full system with a real YOURLS installation:

```javascript
// Set up the environment variables in .env or through the command line
// YOURLS_API_URL, YOURLS_AUTH_METHOD, YOURLS_SIGNATURE_TOKEN, etc.

// Run the integration tests
node tests/integration/test-duplicate-urls.js
node tests/integration/test-duplicate-urls-mcp.js
```

## Common Patterns

### Parameter Validation

```javascript
// Validate required parameters
if (!url) {
  return createApiResponse(false, {
    message: 'URL is required',
    code: 'error:missing_parameter'
  });
}

// Validate parameter formats
try {
  validateUrl(url);
  validateUtmParameters(utmParams);
} catch (error) {
  return createApiResponse(false, {
    message: error.message,
    code: 'error:invalid_parameter'
  });
}
```

### Standardized Responses

```javascript
// Success response
return createApiResponse(true, {
  shorturl: result.shorturl,
  url: url,
  title: title || '',
  message: 'Short URL created successfully'
});

// Error response
return createApiResponse(false, {
  message: 'Unable to create short URL',
  code: 'error:plugin_missing',
  detail: 'The required plugin is not installed'
});
```

### Debug Logging

```javascript
if (process.env.YOURLS_DEBUG === 'true') {
  console.log(`[DEBUG] Function called with params:`, JSON.stringify(params));
  console.log(`[DEBUG] API Response:`, JSON.stringify(response));
}
```

## Environmental Configuration

### Environment Variables

```javascript
// Load from .env file
import dotenv from 'dotenv';
dotenv.config();

// Access environment variables with fallbacks
const config = {
  api_url: process.env.YOURLS_API_URL,
  auth_method: process.env.YOURLS_AUTH_METHOD || 'signature',
  signature_token: process.env.YOURLS_SIGNATURE_TOKEN,
  debug: process.env.YOURLS_DEBUG === 'true'
};
```

### Configuration Validation

```javascript
// Validate required configuration
if (!config.api_url) {
  throw new Error('YOURLS_API_URL environment variable is required');
}

if (config.auth_method === 'signature' && !config.signature_token) {
  throw new Error('YOURLS_SIGNATURE_TOKEN is required when using signature authentication');
}
```

## Conclusion

By following these implementation guidelines, you can ensure that your code interacts effectively with YOURLS-MCP, handling duplicate URLs and other challenges gracefully.