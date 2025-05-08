# Duplicate URL Handling in YOURLS-MCP

This document provides a technical deep dive into how YOURLS-MCP handles the creation of multiple short URLs (with different keywords) for the same destination URL.

## The Challenge

By default, YOURLS enforces unique URLs with the setting `YOURLS_UNIQUE_URLS=true`, which prevents creating multiple short URLs pointing to the same destination URL. While there is an official "Allow Existing URLs" plugin, it only changes the error response to success but still returns the existing URL rather than creating a new one.

The core limitation is in the YOURLS database schema and core API:
- The URL is used as a unique key in the database
- The `shorturl_add` API function checks for URL existence before insertion
- Even with the official plugin, no mechanism exists to truly create duplicates

## Our Solution: Technical Implementation

YOURLS-MCP implements a dual approach to truly allow creating multiple short URLs for the same destination URL. This document details the technical implementation of each approach.

### 1. Custom Plugin Approach (Primary)

The custom "Force Allow Duplicates" plugin works by:

- Hooking into the YOURLS URL uniqueness check with the `url_exists` filter
- Creating a shunt for the `add_new_link` function to bypass standard constraints
- Using database-level operations to insert a duplicate record directly

#### Key Implementation Components

**Plugin Hooks:**
```php
// Intercept the url_exists check
yourls_add_filter('url_exists', 'fad_url_exists', 10, 2);

// Bypass the add_new_link function completely when force=1
yourls_add_filter('shunt_add_new_link', 'fad_shunt_add_new_link', 10, 4);
```

**Database Operations:**
```php
// Direct database insertion code
function fad_add_new_link($url, $keyword, $title = '') {
    global $ydb;
    
    // Sanitize inputs (important security step)
    $url = yourls_sanitize_url($url);
    $keyword = yourls_sanitize_keyword($keyword);
    $title = yourls_sanitize_title($title);
    
    // Prepare the insert statement
    $table = YOURLS_DB_TABLE_URL;
    $binds = array(
        'keyword' => $keyword,
        'url' => $url,
        'title' => $title,
        'timestamp' => date('Y-m-d H:i:s'),
        'ip' => yourls_get_IP(),
        'clicks' => 0
    );
    
    // Execute the insert with proper prepared statements
    $insert = $ydb->fetchAffected("INSERT INTO `$table` (`keyword`, `url`, `title`, `timestamp`, `ip`, `clicks`) VALUES (:keyword, :url, :title, :timestamp, :ip, :clicks)", $binds);
    
    // Return the result
    return $insert;
}
```

**API Integration in YOURLS-MCP:**
```javascript
// src/tools/createCustomUrl.js - Plugin approach implementation
async function tryPluginApproach(client, url, keyword, title) {
  try {
    // Add the force=1 parameter to signal the plugin
    const params = {
      url,
      keyword,
      title: title || '',
      force: '1'
    };
    
    // Make the API call with the special parameter
    const result = await client.makeRequest('shorturl', params);
    
    if (result.status === 'success') {
      return {
        success: true,
        data: result
      };
    }
    
    return {
      success: false,
      error: `Plugin approach failed: ${result.message || 'Unknown error'}`
    };
  } catch (error) {
    return {
      success: false,
      error: `Plugin approach error: ${error.message}`
    };
  }
}
```

### 2. URL Modification Approach (Fallback)

The URL modification approach is implemented entirely in JavaScript and works by:

- Adding a unique timestamp parameter to make the URL technically different
- Preserving the original URL in responses to maintain a good user experience
- Handling edge cases like URLs with existing query parameters or fragments

#### Key Implementation Components

**URL Modification Function:**
```javascript
// src/utils.js - URL modification utilities
/**
 * Modifies a URL by adding a timestamp parameter to make it unique
 * @param {string} url - The URL to modify
 * @returns {string} - The modified URL with a timestamp parameter
 */
function modifyUrlWithTimestamp(url) {
  // Generate a timestamp to make the URL unique
  const timestamp = Date.now();
  
  try {
    const parsedUrl = new URL(url);
    
    // Add the timestamp parameter
    parsedUrl.searchParams.append('_t', timestamp);
    
    // Return the modified URL
    return parsedUrl.toString();
  } catch (error) {
    // Fallback for invalid URLs or environments without URL constructor
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}_t=${timestamp}`;
  }
}
```

**API Implementation:**
```javascript
// src/tools/createCustomUrl.js - URL modification approach
async function tryUrlModificationApproach(client, url, keyword, title) {
  try {
    // Modify the URL to make it unique in the YOURLS database
    const modifiedUrl = modifyUrlWithTimestamp(url);
    
    // Create a short URL with the modified URL
    const result = await client.shorten(modifiedUrl, keyword, title);
    
    if (result.status === 'success') {
      // Replace the modified URL with the original in the response
      // This preserves the user experience while making the URL unique in the database
      return {
        success: true,
        data: {
          ...result,
          url: url, // Use the original URL in the response
          url_internal: modifiedUrl // Keep the modified URL for reference if needed
        }
      };
    }
    
    return {
      success: false,
      error: `URL modification approach failed: ${result.message || 'Unknown error'}`
    };
  } catch (error) {
    return {
      success: false,
      error: `URL modification error: ${error.message}`
    };
  }
}
```

## Decision Flow Algorithm

The YOURLS-MCP implementation uses a sophisticated decision flow to handle URL duplication:

```javascript
// src/tools/createCustomUrl.js - Decision flow
async function createCustomUrl(url, keyword, title = null, isPrivate = false, forceUrlModification = false) {
  // Step 1: Validate inputs
  validateUrl(url);
  validateKeyword(keyword);
  
  // Step 2: Check if the keyword already exists
  try {
    const existingUrl = await checkKeywordAvailability(client, keyword);
    
    // If keyword exists and points to the same URL, return success
    if (existingUrl === url) {
      return createApiResponse(true, {
        message: 'Short URL already exists with this keyword',
        shorturl: buildShortUrl(keyword),
        url: url,
        title: title || '',
        keyword: keyword
      });
    }
    
    // If keyword exists and points to a different URL, return error
    if (existingUrl) {
      throw new Error(`Keyword "${keyword}" already exists and points to a different URL`);
    }
  } catch (error) {
    // Handle keyword check errors (except for "not found" which is good in this case)
    if (!error.message.includes('not found')) {
      throw error;
    }
  }
  
  // Step 3: Choose the approach based on parameters and availability
  
  // Skip plugin approach if explicitly asked to use URL modification
  if (!forceUrlModification) {
    // Try the plugin approach first
    const pluginResult = await tryPluginApproach(client, url, keyword, title);
    
    if (pluginResult.success) {
      // Plugin approach succeeded, return the result
      return createApiResponse(true, {
        message: 'Short URL created successfully using plugin approach',
        approach: 'plugin',
        shorturl: pluginResult.data.shorturl,
        url: url,
        title: title || '',
        keyword: keyword
      });
    }
    
    // Log that we're falling back
    debug('Plugin approach failed, falling back to URL modification');
  }
  
  // Step 4: Fall back to URL modification approach
  const modificationResult = await tryUrlModificationApproach(client, url, keyword, title);
  
  if (modificationResult.success) {
    // URL modification approach succeeded, return the result
    return createApiResponse(true, {
      message: 'Short URL created successfully using URL modification',
      approach: 'modification',
      shorturl: modificationResult.data.shorturl,
      url: url, // Return the original URL, not the modified one
      url_internal: modificationResult.data.url_internal, // Include the internal modified URL for reference
      title: title || '',
      keyword: keyword
    });
  }
  
  // Step 5: Both approaches failed, return error
  return createApiResponse(false, {
    message: 'Unable to create short URL with either approach',
    error: {
      plugin: modificationResult.error,
      modification: modificationResult.error
    }
  });
}
```

## Error Handling and Edge Cases

The implementation handles several edge cases:

### 1. Plugin Detection

YOURLS-MCP can detect if the plugin is installed and active:

```javascript
// Utility to detect plugin availability
async function isPluginAvailable(client, pluginName, testAction, testParams) {
  try {
    // Make a test request to check if the plugin responds correctly
    const result = await client.makeRequest(testAction, {
      ...testParams,
      plugin: pluginName
    });
    
    // Check if the response indicates the plugin is active
    return result && !result.error && !result.message?.includes('not found');
  } catch (error) {
    // If error contains specific patterns, the plugin is probably not installed
    return false;
  }
}
```

### 2. Handling URLs with Query Parameters

Special handling is needed for URLs that already have query parameters:

```javascript
// Handle URLs with existing query parameters
function addTimestampToUrl(url) {
  if (url.includes('#')) {
    // Handle URLs with fragments
    const [baseUrl, fragment] = url.split('#');
    return `${addParameterToUrl(baseUrl, '_t', Date.now())}#${fragment}`;
  }
  
  return addParameterToUrl(url, '_t', Date.now());
}

function addParameterToUrl(url, paramName, paramValue) {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${paramName}=${paramValue}`;
}
```

### 3. Response Normalization

To ensure consistent user experience, the response is normalized regardless of approach:

```javascript
// Normalize response to hide implementation details
function normalizeResponse(result, originalUrl, approach) {
  return {
    ...result,
    status: 'success',
    message: 'Short URL created successfully',
    url: originalUrl, // Always use original URL in responses
    approach: approach // Include the approach used for debugging
  };
}
```

## Testing

You can test both approaches using the provided test scripts:

```bash
# For direct client testing
node scripts/tests/test-duplicate-url.js

# For MCP API testing
node scripts/tests/test-duplicate-urls-mcp.js
```

These scripts run comprehensive tests on both approaches and produce detailed output showing which methods are working.

### Test Configuration

```javascript
// Configure environment variables for testing
// Required variables:
// - YOURLS_API_URL: URL to your YOURLS API endpoint
// - YOURLS_AUTH_METHOD: Either 'signature' or 'password'
// - YOURLS_SIGNATURE_TOKEN: Your signature token (for signature auth)
// - YOURLS_USERNAME and YOURLS_PASSWORD (for password auth)
```

## Comparison of Approaches

| Aspect | Custom Plugin | URL Modification |
|--------|--------------|------------------|
| Installation | Requires plugin installation | Works without plugins |
| URLs in database | Identical to user input | Contains timestamp parameter |
| User experience | Perfect - original URL in all contexts | Good - original URL in responses |
| Configuration | Activate plugin in YOURLS admin | No configuration needed |
| Database impact | Creates true duplicates | Creates technically unique entries |
| Performance | Direct database operations | Standard API with extra processing |
| Analytics tracking | Standard tracking | Standard tracking |
| Caching behavior | Standard caching | May have cache variations |
| Error handling | Plugin-specific errors possible | Standard API errors |
| When to use | Primary approach when possible | Fallback or when plugin can't be installed |

## Integration with MCP Tools

The `create_custom_url` tool integrates this functionality into the MCP server:

```javascript
// src/tools/index.js - Registration of the create_custom_url tool
const createCustomUrlTool = {
  name: 'create_custom_url',
  description: 'Creates a custom short URL with a specific keyword, supporting duplicate URLs',
  inputSchema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'The URL to shorten'
      },
      keyword: {
        type: 'string',
        description: 'The custom keyword to use in the short URL'
      },
      title: {
        type: 'string',
        description: 'Optional title for the URL'
      },
      is_private: {
        type: 'boolean',
        description: 'Whether the URL should be private (if supported)'
      },
      force_url_modification: {
        type: 'boolean',
        description: 'Whether to force the URL modification approach instead of trying the plugin approach'
      }
    },
    required: ['url', 'keyword']
  },
  execute: async (params) => {
    try {
      const result = await createCustomUrl(
        params.url,
        params.keyword,
        params.title || null,
        params.is_private || false,
        params.force_url_modification || false
      );
      
      return createMcpResponse(result.success, result.data);
    } catch (error) {
      return createMcpResponse(false, {
        error: true,
        message: error.message,
        content: [
          {
            type: 'text',
            text: `Error creating custom URL: ${error.message}`
          }
        ]
      });
    }
  }
};
```

## Debugging and Development

For debugging purposes, set the `YOURLS_DEBUG` environment variable to `true`:

```javascript
// Debugging utility
function debug(...args) {
  if (process.env.YOURLS_DEBUG === 'true') {
    console.log('[DEBUG]', ...args);
  }
}
```

This will output detailed information about the duplicate URL handling process, including:
- Which approach is being tried
- API responses
- Fall back decisions
- Error details

## Error Codes and Messages

The following error codes may be encountered when working with duplicate URLs:

| Error Code | Description | Resolution |
|------------|-------------|------------|
| `error:keyword_exists` | Keyword already exists for a different URL | Choose a different keyword |
| `error:plugin_not_found` | Force Allow Duplicates plugin not installed | Install the plugin or use URL modification approach |
| `error:plugin_not_active` | Plugin installed but not activated | Activate the plugin in YOURLS admin |
| `error:url_modification_failed` | URL modification approach failed | Check the URL format and YOURLS configuration |

## Conclusion

YOURLS-MCP provides a comprehensive solution to the URL duplication challenge, offering both a clean, plugin-based approach and a reliable fallback mechanism. This ensures that users can create multiple short URLs for the same destination URL in any YOURLS environment.

For a more user-friendly overview of this feature, see the [Duplicate URL Feature](duplicate-url-feature.md) document.