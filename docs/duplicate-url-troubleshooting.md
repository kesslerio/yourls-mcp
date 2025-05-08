# Troubleshooting Duplicate URL Handling

This document provides solutions for common issues you might encounter when using the duplicate URL handling features of YOURLS-MCP.

## Common Issues and Solutions

### Plugin Approach Issues

#### 1. Plugin Not Being Detected

**Symptoms:**
- YOURLS-MCP always falls back to URL modification approach
- Debug logs show "Plugin approach failed" messages

**Possible Causes:**
- Plugin is not installed correctly
- Plugin is not activated in YOURLS admin
- Plugin file permissions are incorrect

**Solutions:**
1. Verify the plugin folder exists in your YOURLS installation:
   ```
   ls -la /path/to/your/YOURLS/user/plugins/force-allow-duplicates/
   ```

2. Check if the plugin is activated in YOURLS admin panel
   - Log in to your YOURLS admin interface
   - Go to the "Manage Plugins" page
   - Ensure "Force Allow Duplicates" is listed and activated

3. Verify file permissions:
   ```
   chmod -R 755 /path/to/your/YOURLS/user/plugins/force-allow-duplicates/
   ```

4. Check YOURLS error logs for any PHP errors related to the plugin:
   ```
   tail -n 50 /path/to/your/YOURLS/user/logs/yourls-error.log
   ```

5. Manually test the plugin with a direct API call:
   ```
   curl "https://your-yourls-domain.com/yourls-api.php?signature=your-signature&action=shorturl&url=https://example.com&keyword=test123&format=json&force=1"
   ```

#### 2. "Plugin Not Activated" Errors

**Symptoms:**
- API responses containing "Plugin not activated" or similar messages
- YOURLS-MCP reports "Plugin approach failed" in logs

**Possible Causes:**
- The plugin is installed but not activated
- Plugin deactivated after installation

**Solutions:**
1. Activate the plugin in YOURLS admin panel
2. Check if the plugin appears in the active plugins list in the database:
   ```sql
   SELECT * FROM yourls_options WHERE option_name = 'active_plugins';
   ```

3. If needed, manually add the plugin to the active plugins list:
   ```sql
   UPDATE yourls_options 
   SET option_value = CONCAT(option_value, 'a:1:{i:0;s:21:\"force-allow-duplicates\";}')
   WHERE option_name = 'active_plugins';
   ```

#### 3. Database Errors with Plugin Approach

**Symptoms:**
- Error messages mentioning database issues
- Plugin fails only when trying to create duplicate URLs

**Possible Causes:**
- Database permissions issues
- Database constraints preventing duplicates
- Plugin code compatibility issues with your YOURLS version

**Solutions:**
1. Check database user permissions (needs INSERT privileges)
2. Verify your YOURLS version is compatible with the plugin (YOURLS 1.7+ recommended)
3. Look for database constraint errors in the logs
4. Check if your MySQL/MariaDB has strict mode enabled, which might prevent certain operations

### URL Modification Approach Issues

#### 1. Modified URLs Not Working

**Symptoms:**
- Short URLs created with URL modification approach redirect incorrectly
- Destination website rejects URLs with added parameters

**Possible Causes:**
- The destination website filters or rejects URLs with certain parameters
- The URL is already very long and exceeds length limits with added parameters
- The URL contains special characters that aren't properly encoded

**Solutions:**
1. If certain websites reject the modified URLs, you may need to use the plugin approach
2. Check if the URL already contains a `_t` parameter that might conflict
3. For very long URLs, consider using a URL shortener for the destination URL first

#### 2. Inconsistent API Responses

**Symptoms:**
- API responses show different URLs than expected
- Original URL and modified URL are mixed up in responses

**Possible Causes:**
- Response normalization code isn't working correctly
- Multiple layers of URL modification

**Solutions:**
1. Enable debug mode to see the full API responses:
   ```
   YOURLS_DEBUG=true node your-script.js
   ```

2. Check the raw API response to understand what's happening:
   ```javascript
   const rawResponse = await client.makeRequest('shorturl', { 
     url: 'https://example.com', 
     keyword: 'test' 
   });
   console.log('Raw response:', JSON.stringify(rawResponse, null, 2));
   ```

3. Update to the latest version of YOURLS-MCP, which may include fixes for these issues

### General Troubleshooting

#### 1. YOURLS_UNIQUE_URLS Setting Conflicts

**Symptoms:**
- Duplicate URLs work without any special handling
- YOURLS-MCP reports that URLs are already shortened

**Possible Causes:**
- Your YOURLS instance has `YOURLS_UNIQUE_URLS` set to `false` in config.php
- Another plugin is already handling duplicate URLs

**Solutions:**
1. Check your YOURLS configuration:
   ```php
   // In config.php
   define('YOURLS_UNIQUE_URLS', true); // Should be true for our plugin to be useful
   ```

2. If you intentionally have `YOURLS_UNIQUE_URLS` set to `false`, you don't need either approach

#### 2. Authentication Issues

**Symptoms:**
- All API calls fail with authentication errors
- Only duplicate URL operations fail

**Possible Causes:**
- Incorrect API credentials
- Plugin requires admin privileges

**Solutions:**
1. Verify your authentication configuration:
   ```javascript
   const config = {
     api_url: 'https://your-yourls-domain.com/yourls-api.php',
     auth_method: 'signature', // or 'password'
     signature_token: 'your-signature-token', // for signature auth
     username: 'your-username', // for password auth
     password: 'your-password' // for password auth
   };
   ```

2. Test with a simple API call to ensure authentication works:
   ```
   curl "https://your-yourls-domain.com/yourls-api.php?signature=your-signature&action=stats&format=json"
   ```

## Advanced Debugging

For more detailed troubleshooting, you can use advanced debugging techniques:

### 1. Detailed Logging

Enable detailed logging by setting the `YOURLS_DEBUG` environment variable:

```bash
YOURLS_DEBUG=true node your-script.js
```

### 2. Network Monitoring

Use network monitoring tools to see the exact API requests and responses:

```bash
# Using Wireshark to monitor API traffic
sudo wireshark -i lo0 -f "port 80 or port 443" -k

# Using tcpdump
sudo tcpdump -i any -n port 80 or port 443 -A | grep -i yourls
```

### 3. Testing Individual Components

Test the plugin and URL modification approaches separately:

```javascript
// Test only the plugin approach
const pluginResult = await client.makeRequest('shorturl', {
  url: 'https://example.com',
  keyword: 'test-plugin',
  force: '1'
});
console.log('Plugin result:', pluginResult);

// Test only the URL modification approach
const modifiedUrl = `https://example.com?_t=${Date.now()}`;
const modificationResult = await client.shorten(modifiedUrl, 'test-modified');
console.log('Modification result:', modificationResult);
```

## Compatibility Issues

### 1. YOURLS Version Compatibility

The Force Allow Duplicates plugin has been tested with:
- YOURLS 1.7.x - Full compatibility
- YOURLS 1.8.x - Full compatibility
- YOURLS 1.9.x - Generally compatible, but may have issues with some advanced features

If using an older or newer YOURLS version, you might encounter issues that require plugin modifications.

### 2. Browser Compatibility

The URL modification approach may have issues with certain browsers or user agents that handle URLs differently:
- Internet Explorer and Edge Legacy may normalize URLs differently
- Some mobile browsers might handle URL parameters in non-standard ways
- Browser extensions for privacy or security might strip URL parameters

### 3. Server Environment Compatibility

Different server environments may affect how the plugin works:
- Apache with mod_rewrite vs Nginx URL rewriting
- PHP versions (7.0+ recommended)
- MySQL vs MariaDB differences

## Getting Help

If you've tried the troubleshooting steps above and still have issues:

1. Open an issue on the [YOURLS-MCP GitHub repository](https://github.com/kesslerio/yourls-mcp/issues) with:
   - Detailed description of the issue
   - Your environment details (YOURLS version, PHP version, server setup)
   - Any error messages or logs
   - Steps to reproduce the issue

2. Join the [YOURLS community forum](https://yourls.org/community/) for additional help from other users

3. Check the YOURLS documentation on [plugin development](https://docs.yourls.org/development/plugins.html) if you need to modify the plugin

## Self-Diagnosis Checklist

Use this checklist to systematically diagnose issues:

- [ ] Plugin properly installed in YOURLS plugin directory
- [ ] Plugin activated in YOURLS admin panel
- [ ] YOURLS_UNIQUE_URLS set to true in config.php
- [ ] API credentials correctly configured
- [ ] Correct API URL being used
- [ ] Database has correct permissions
- [ ] No conflicting plugins installed
- [ ] YOURLS version compatible with the plugin
- [ ] URL parameters not being stripped by destination website
- [ ] Proper error handling in your code
- [ ] Latest version of YOURLS-MCP being used