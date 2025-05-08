# Duplicate URL Handling Feature

One of the unique features of YOURLS-MCP is its ability to create multiple short URLs (with different keywords) for the same destination URL. This document provides detailed information about this feature.

## The Challenge

By default, YOURLS enforces URL uniqueness with the `YOURLS_UNIQUE_URLS=true` setting. This means you cannot create multiple short URLs that point to the same destination URL. While there is an official "Allow Existing URLs" plugin, it only changes error responses to success but still returns the existing URL rather than creating a new one.

## Our Solution

YOURLS-MCP implements a comprehensive dual-approach to truly allow creating multiple short URLs for the same destination URL:

### 1. Force Allow Duplicates Plugin (Primary Approach)

We've developed a custom plugin that:
- Bypasses the YOURLS core uniqueness constraints
- Allows creating true duplicate destination URLs with different keywords
- Preserves all analytics and functionality
- Maintains the integrity of your YOURLS database

**Installation:**
1. The plugin is included in the YOURLS-MCP repository in the `YOURLS/user/plugins/force-allow-duplicates/` directory
2. Copy this directory to your YOURLS installation's plugins folder
3. Activate the plugin in your YOURLS admin interface
4. No additional configuration is required - the plugin works immediately after activation

**How It Works:**
- The plugin hooks into YOURLS' `url_exists` filter and `shunt_add_new_link` function
- When the `force=1` parameter is provided, it bypasses the uniqueness check
- It directly writes to the YOURLS database using proper sanitization and validation
- This approach creates true duplicates without modifying the destination URL

**Technical Details:**
```php
// Key filter hook that allows duplicate URLs to be created
yourls_add_filter('url_exists', 'fad_url_exists', 10, 2);

function fad_url_exists($return, $url) {
    // If 'force' parameter is set, bypass the uniqueness check
    if (isset($_REQUEST['force']) && $_REQUEST['force'] == '1') {
        return false; // Tell YOURLS the URL doesn't exist, even if it does
    }
    return $return; // Otherwise, use standard YOURLS behavior
}
```

### 2. URL Modification Approach (Fallback)

If the plugin approach is unavailable, YOURLS-MCP falls back to a URL modification approach:
- Adds a timestamp parameter to the destination URL (e.g., `https://example.com?_t=1621234567890`)
- Creates a short URL with this slightly modified URL
- Returns responses that display the original URL to maintain a good user experience
- Handles both URLs with existing query parameters and URLs without them

**Technical Details:**
```javascript
// Example of how URL modification is implemented
function modifyUrlWithTimestamp(url) {
  const timestamp = Date.now();
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_t=${timestamp}`;
}
```

This approach works even without any plugins installed, making it universally compatible with all YOURLS installations.

## Automatic Detection and Selection

YOURLS-MCP intelligently:
1. First tries the plugin approach (when `force_url_modification=false` or not specified)
2. If that fails, automatically falls back to the URL modification approach
3. Allows explicitly requesting the URL modification approach (by setting `force_url_modification=true`)

The decision flow is:
1. Check if keyword already exists
2. If keyword is available, try plugin approach (unless `force_url_modification=true`)
3. If plugin fails or is bypassed, fall back to URL modification approach
4. Return a consistent response format regardless of which approach succeeded

## Using the Feature

### Claude Desktop / Claude.ai

Simply ask Claude to create multiple short URLs for the same destination:

```
Create three different short URLs for https://example.com using the keywords "ex1", "ex2", and "ex3"
```

Claude will automatically use the appropriate approach based on your YOURLS setup. You can also specify which approach to use:

```
Create a short URL for https://example.com using the keyword "example" with the URL modification approach
```

Or:

```
Create a short URL for https://example.com using the keyword "example" using the plugin approach if available
```

### Direct API Usage

For developers, you can use the `create_custom_url` tool with the following parameters:

```javascript
// Standard approach (tries plugin first, falls back to modification)
mcpServer.handleExecute({
  tool: 'create_custom_url',
  params: {
    url: 'https://example.com',
    keyword: 'example1'
  }
});

// Force URL modification approach
mcpServer.handleExecute({
  tool: 'create_custom_url',
  params: {
    url: 'https://example.com',
    keyword: 'example2',
    force_url_modification: true
  }
});

// With optional title
mcpServer.handleExecute({
  tool: 'create_custom_url',
  params: {
    url: 'https://example.com',
    keyword: 'example3',
    title: 'Example Website',
    force_url_modification: false
  }
});
```

### Python API Client Usage

```python
from yourls_mcp import YourlsClient

client = YourlsClient(
    api_url="https://your-yourls-instance.com/yourls-api.php",
    auth_method="signature",
    signature_token="your-token"
)

# Create a short URL with default approach (tries plugin first)
result1 = client.create_custom_url(
    url="https://example.com",
    keyword="example1"
)

# Force URL modification approach
result2 = client.create_custom_url(
    url="https://example.com",
    keyword="example2",
    force_url_modification=True
)

print(f"First URL: {result1['shorturl']}")
print(f"Second URL: {result2['shorturl']}")
```

## Field Testing Results

This feature has been successfully tested on multiple YOURLS installations with different configurations:

1. **With Plugin:** Creation of multiple true duplicate URLs works perfectly
2. **Without Plugin:** The URL modification approach successfully creates functionally equivalent short URLs
3. **Mixed Environment:** The automatic fallback mechanism works reliably when the plugin is deactivated

### Test Results Matrix

| Test Case | With Plugin | Without Plugin |
|-----------|-------------|----------------|
| First short URL | ✅ Success | ✅ Success |
| Second URL (same destination) | ✅ Success (identical URL in DB) | ✅ Success (modified URL in DB) |
| URL with query parameters | ✅ Success | ✅ Success (appends timestamp param) |
| URL with fragments (#) | ✅ Success | ✅ Success (preserves fragment) |
| Long URLs (2000+ chars) | ✅ Success | ✅ Success |
| Special characters in URL | ✅ Success | ✅ Success |

## Best Practices

1. Install the Force Allow Duplicates plugin when possible for the optimal experience
2. Only specify `force_url_modification=true` when you specifically want to avoid using the plugin approach
3. Consider using the URL modification approach when integrating with systems that require strictly unique destination URLs
4. Always validate keywords before creating short URLs to avoid conflicts
5. Use consistent error handling for both approaches
6. Keep the plugin updated to ensure compatibility with future YOURLS versions

### Error Handling Recommendations

```javascript
try {
  const result = await client.createCustomUrl(url, keyword, title, false, forceUrlModification);
  // Handle success
} catch (error) {
  if (error.message.includes('keyword already exists')) {
    // Handle keyword conflict
  } else if (error.message.includes('plugin not activated')) {
    // Recommend plugin installation
  } else {
    // Handle other errors
  }
}
```

## Comparison of Approaches

| Feature | Plugin Approach | URL Modification Approach |
|---------|----------------|---------------------------|
| Setup Required | Plugin installation | None |
| URL in Database | Original URL | Modified URL with timestamp |
| User Experience | Ideal | Very good (original URL shown) |
| Analytics | Full tracking | Full tracking |
| Compatibility | Requires plugin access | Works universally |
| Performance | Slightly better | Slightly more overhead |
| When to Use | Default choice | Fallback or when plugin can't be used |

## Future Enhancements

Future versions of YOURLS-MCP may include:
- Advanced duplicate URL management dashboard
- Extended analytics for tracking performance across duplicate URLs
- Customizable URL modification parameters beyond timestamps
- Bulk creation of multiple short URLs for the same destination
- API metrics to track usage of each approach

## Troubleshooting

If you encounter issues with duplicate URL handling:

1. Verify the plugin is correctly installed and activated
2. Check YOURLS database permissions (the plugin needs write access)
3. Ensure your YOURLS version is compatible (tested with YOURLS 1.7+)
4. If using the URL modification approach, check that query parameter handling is correct
5. Review server logs for any PHP errors related to the plugin

For questions, feature requests, or issues related to duplicate URL handling, please visit the [GitHub repository](https://github.com/kesslerio/yourls-mcp/issues).