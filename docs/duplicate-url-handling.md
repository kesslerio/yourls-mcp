# Duplicate URL Handling in YOURLS-MCP

This document explains how YOURLS-MCP handles the creation of multiple short URLs (with different keywords) for the same destination URL.

## The Challenge

By default, YOURLS enforces unique URLs with the setting `YOURLS_UNIQUE_URLS=true`, which prevents creating multiple short URLs pointing to the same destination URL. While there is an official "Allow Existing URLs" plugin, it only changes the error response to success but still returns the existing URL rather than creating a new one.

## Our Solution

YOURLS-MCP implements a dual approach to truly allow creating multiple short URLs for the same destination URL:

### 1. Custom Plugin Approach (Primary)

We provide a custom plugin called "Force Allow Duplicates" that:

- Hooks into the YOURLS core URL uniqueness check
- Bypasses the constraint when the `force=1` parameter is present in the request
- Directly adds the new entry to the database with a custom implementation

This approach creates true duplicate URLs without modifying the destination URL.

**Installation:**
1. Copy the `YOURLS/user/plugins/force-allow-duplicates/` directory to your YOURLS plugins folder
2. Activate the plugin in your YOURLS admin panel
3. No configuration required

**Usage with MCP:**
```javascript
// Claude can use the create_custom_url tool with force_url_modification set to false
await mcpServer.handleExecute({
  tool: 'create_custom_url',
  params: {
    url: 'https://example.com',
    keyword: 'example2',
    force_url_modification: false
  }
});
```

### 2. URL Modification Approach (Fallback)

If the custom plugin is not installed or not working, YOURLS-MCP falls back to a URL modification approach:

- Appends a timestamp parameter to the URL (e.g., `?_t=1654321098765`)
- Creates a short URL with this modified URL
- Returns the original URL in responses to maintain a good user experience

This approach is used automatically when the plugin approach fails but can also be explicitly requested.

**Usage with MCP:**
```javascript
// Claude can explicitly request the URL modification approach
await mcpServer.handleExecute({
  tool: 'create_custom_url',
  params: {
    url: 'https://example.com',
    keyword: 'example3',
    force_url_modification: true
  }
});
```

## Automatic Fallback Mechanism

YOURLS-MCP tries approaches in this order:

1. Check if the keyword already exists
2. If not, try the custom plugin approach (unless `force_url_modification=true`)
3. If that fails, automatically try the URL modification approach

This provides a robust solution that works with any YOURLS installation, with or without plugins.

## Testing

You can test both approaches using the provided test scripts:

```bash
# For direct client testing
node test-duplicate-url.js

# For MCP API testing
node tests/integration/test-duplicate-urls-mcp.js
```

Both scripts require setting up the environment variables (see `.env.example`).

## Comparison of Approaches

| Aspect | Custom Plugin | URL Modification |
|--------|--------------|------------------|
| Installation | Requires plugin installation | Works without plugins |
| URLs in database | Identical to user input | Contains timestamp parameter |
| User experience | Perfect - original URL in all contexts | Good - original URL in responses |
| Configuration | Activate plugin in YOURLS admin | No configuration needed |
| When to use | Primary approach when possible | Fallback or when plugin can't be installed |

## Conclusion

YOURLS-MCP provides a comprehensive solution to the URL duplication challenge, offering both a clean, plugin-based approach and a reliable fallback mechanism. This ensures that users can create multiple short URLs for the same destination URL in any YOURLS environment.