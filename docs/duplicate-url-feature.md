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

**Installation:**
1. The plugin is included in the YOURLS-MCP repository in the `YOURLS/user/plugins/force-allow-duplicates/` directory
2. Copy this directory to your YOURLS installation's plugins folder
3. Activate the plugin in your YOURLS admin interface

**How It Works:**
- The plugin hooks into YOURLS' `url_exists` filter and `shunt_add_new_link` function
- When the `force=1` parameter is provided, it bypasses the uniqueness check
- This approach creates true duplicates without modifying the destination URL

### 2. URL Modification Approach (Fallback)

If the plugin approach is unavailable, YOURLS-MCP falls back to a URL modification approach:
- Adds a timestamp parameter to the destination URL (e.g., `https://example.com?_t=1621234567890`)
- Creates a short URL with this slightly modified URL
- Returns responses that display the original URL to maintain a good user experience

This approach works even without any plugins installed.

## Automatic Detection and Selection

YOURLS-MCP intelligently:
1. First tries the plugin approach (when `force_url_modification=false` or not specified)
2. If that fails, automatically falls back to the URL modification approach
3. Allows explicitly requesting the URL modification approach (by setting `force_url_modification=true`)

## Using the Feature

### Claude Desktop / Claude.ai

Simply ask Claude to create multiple short URLs for the same destination:

```
Create three different short URLs for https://example.com using the keywords "ex1", "ex2", and "ex3"
```

Claude will automatically use the appropriate approach based on your YOURLS setup.

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
```

## Field Testing Results

This feature has been successfully tested on multiple YOURLS installations with different configurations:

1. **With Plugin:** Creation of multiple true duplicate URLs works perfectly
2. **Without Plugin:** The URL modification approach successfully creates functionally equivalent short URLs

## Best Practices

1. Install the Force Allow Duplicates plugin when possible for the optimal experience
2. Only specify `force_url_modification=true` when you specifically want to avoid using the plugin approach
3. Consider using the URL modification approach when integrating with systems that require strictly unique destination URLs

## Future Enhancements

Future versions of YOURLS-MCP may include:
- Advanced duplicate URL management features
- Additional parameters for controlling URL modification behavior
- Improved analytics for tracking duplicate URLs

For questions, feature requests, or issues related to duplicate URL handling, please visit the [GitHub repository](https://github.com/kesslerio/yourls-mcp/issues).