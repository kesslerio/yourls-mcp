# YOURLS-MCP Tests

This directory contains tests for the YOURLS-MCP project.

## Directory Structure

- `api/` - Unit tests for the YOURLS API client
- `integration/` - Integration tests for the YOURLS-MCP functionality
- `mcp/` - Tests for the MCP server functionality
- `scripts/` - Test scripts for manual testing and demonstrations

## Test Categories

### API Tests
Unit tests for the YOURLS API client implementation in `src/api.js`.

### MCP Tests
Tests for the MCP server implementation and tool functionality.

### Integration Tests
Tests for the full integration of YOURLS-MCP with a YOURLS instance.
These tests validate specific features like:
- Duplicate URL handling with the Force Allow Duplicates plugin
- URL modification approach for creating duplicate URLs
- Custom URL creation with the MCP create_custom_url tool

### Test Scripts
These scripts are used for manual testing and demonstrating specific functionality.
For example:
- `create-google.js` - Creates a "GOOGLE" short URL for google.com
- `create-goog.js` - Creates a "GOOG" short URL for google.com
- `create-random.js` - Creates a random short URL for google.com

## Running Tests

### API and MCP Tests
Python-based unit tests can be run with:
```
python -m unittest
```

### Integration Tests
JavaScript-based integration tests can be run individually:
```
node tests/integration/test-duplicate-urls.js
```

### Test Scripts
Test scripts can be run individually:
```
node tests/scripts/create-google.js
```

## Test Environment
Tests require proper environment variables set. See the main README for configuration details.