# Test Environment Setup for YOURLS-MCP

> **Version:** 1.2.0 | **Last Updated:** May 2025 | **Compatibility:** YOURLS 1.7+, 1.8+, 1.9.2+

This document provides instructions for setting up a test environment to properly test the YOURLS-MCP functionality, including duplicate URL handling features.

## Prerequisites

To run the tests successfully, you need:

1. A running YOURLS installation (v1.7+)
2. API access to this YOURLS installation
3. Node.js (v14+) for running the JavaScript tests
4. Python 3.6+ for running the Python client tests

## Setting Up YOURLS for Testing

### Option 1: Docker Setup (Recommended)

This is the quickest way to get a YOURLS instance running for testing:

```bash
# Create a directory for YOURLS data
mkdir -p ~/yourls-test/data

# Run YOURLS in a Docker container
docker run -d \
  --name yourls-test \
  -p 8080:80 \
  -e YOURLS_SITE="http://localhost:8080" \
  -e YOURLS_USER="admin" \
  -e YOURLS_PASS="test_password" \
  -v ~/yourls-test/data:/var/www/html/user \
  yourls:latest

# Wait for YOURLS to start up
sleep 10

# Install the Force Allow Duplicates plugin
docker exec -it yourls-test mkdir -p /var/www/html/user/plugins/force-allow-duplicates
docker cp ./yourls-force-allow-duplicates/. yourls-test:/var/www/html/user/plugins/force-allow-duplicates/
```

After running these commands, YOURLS will be available at http://localhost:8080/admin/

### Option 2: Manual Installation

If you prefer to install YOURLS manually:

1. Download YOURLS from [yourls.org](https://yourls.org/)
2. Set up YOURLS following the [official documentation](https://yourls.org/#Install)
3. Create a test database for YOURLS
4. Install and activate the Force Allow Duplicates plugin:
   ```
   cp -r yourls-force-allow-duplicates /path/to/yourls/user/plugins/
   ```

## Configuring the Test Environment

### Environment Variables

The test scripts use environment variables for configuration. Set these up before running tests:

```bash
# Required
export YOURLS_API_URL="http://localhost:8080/yourls-api.php"
export YOURLS_AUTH_METHOD="password"  # or "signature"
export YOURLS_USERNAME="admin"
export YOURLS_PASSWORD="test_password"

# Optional (for signature auth)
export YOURLS_SIGNATURE_TOKEN="your-signature-token"
export YOURLS_SIGNATURE_TTL="43200"

# Debug mode
export YOURLS_DEBUG="true"
```

For convenience, you can save these in a `.env` file and source it:

```bash
source .env
```

Or use the provided test script:

```bash
./test-server.sh
```

### Test Configuration Check

To ensure your test configuration is working properly, run the simple test script:

```bash
node scripts/tests/mock-test.js
```

If it runs without errors, your environment is set up correctly.

## Running the Tests

### JavaScript Tests

```bash
# Standard duplicate URL test
node scripts/tests/test-duplicate-url.js

# MCP integration test
node scripts/tests/test-duplicate-urls-mcp.js

# Error handling test
node scripts/tests/test-duplicate-error-handling.js
```

### Python Tests

```bash
# All Python tests
pytest tests/

# Specific Python tests
pytest tests/api/test_client.py::TestYourlsClient::test_shorten_url -v
```

## Common Issues and Solutions

### Plugin Not Detected

If your tests show that the plugin approach is not working:

1. Verify the plugin is installed:
   ```bash
   ls -la /path/to/yourls/user/plugins/force-allow-duplicates/
   ```

2. Activate the plugin in the YOURLS admin interface (http://localhost:8080/admin/plugins.php)

3. Check YOURLS error logs:
   ```bash
   docker exec -it yourls-test cat /var/www/html/user/logs/yourls-error.log
   ```

### Authentication Issues

If your tests fail with authentication errors:

1. Verify your credentials are correct
2. For signature-based auth, check that your signature token is correct
3. Try using password-based auth for simplicity during testing
4. Ensure your YOURLS instance is accessible at the URL you specified

### Database Issues

If tests fail with database errors:

1. Check that YOURLS is properly set up with its database
2. Verify database permissions
3. Ensure `YOURLS_UNIQUE_URLS` is set to `true` in YOURLS config

## Testing Different YOURLS Versions

To test compatibility with different YOURLS versions, you can specify the version in the Docker command:

```bash
# Test with YOURLS 1.7.9
docker run -d --name yourls-test-1-7 -p 8071:80 -e YOURLS_SITE="http://localhost:8071" -e YOURLS_USER="admin" -e YOURLS_PASS="test_password" yourls:1.7.9

# Test with YOURLS 1.8.2
docker run -d --name yourls-test-1-8 -p 8081:80 -e YOURLS_SITE="http://localhost:8081" -e YOURLS_USER="admin" -e YOURLS_PASS="test_password" yourls:1.8.2

# Test with YOURLS 1.9.2 (latest)
docker run -d --name yourls-test-1-9 -p 8091:80 -e YOURLS_SITE="http://localhost:8091" -e YOURLS_USER="admin" -e YOURLS_PASS="test_password" yourls:1.9.2
```

Then update your `YOURLS_API_URL` environment variable to point to the appropriate port before running the tests.

### YOURLS 1.9.x Compatibility Notes

YOURLS 1.9.x includes significant changes in how plugins are registered and how the API functions. The Force Allow Duplicates plugin has been specifically tested with YOURLS 1.9.2 to ensure compatibility.

#### Known Changes in YOURLS 1.9.x

1. **Enhanced Security Features**
   - Stronger CSRF protection
   - More restrictive input validation
   - Changes to signature token handling

2. **Plugin Management Changes**
   - Updated plugin registration hooks
   - New activation/deactivation flows
   - Changes to plugin loading order

3. **API Changes**
   - More consistent error responses
   - Improved authentication checks
   - Additional parameters for some endpoints

#### Testing Recommendations for YOURLS 1.9.x

When testing with YOURLS 1.9.x, pay special attention to:

1. **Authentication**: Test both signature and password authentication methods to ensure both work correctly.

2. **Plugin Activation**: Manually verify the plugin shows as active in the admin interface after installation.

3. **Error Handling**: The error format may be slightly different in 1.9.x. Ensure your code properly handles these differences.

4. **Database Operations**: Some database functions have changed in 1.9.x. Monitor logs for SQL errors.

5. **Run the complete test suite**: Run all tests to verify full compatibility:
   ```bash
   export YOURLS_API_URL="http://localhost:8091/yourls-api.php"
   node scripts/tests/test-duplicate-url.js
   node scripts/tests/test-duplicate-urls-mcp.js
   node scripts/tests/test-duplicate-error-handling.js
   ```

If you encounter issues specific to YOURLS 1.9.x, please report them with detailed reproduction steps so we can address compatibility problems.

## Troubleshooting

### Viewing Docker Logs

```bash
docker logs -f yourls-test
```

### Accessing YOURLS Container Shell

```bash
docker exec -it yourls-test /bin/bash
```

### Restarting YOURLS

```bash
docker restart yourls-test
```

### Cleaning Up Test Data

To start with a fresh YOURLS installation:

```bash
docker stop yourls-test
docker rm yourls-test
rm -rf ~/yourls-test/data
# Then re-run the Docker setup commands
```