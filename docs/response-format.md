# YOURLS-MCP Response Format

This document describes the standardized response format used by all YOURLS-MCP tools.

## Overview

As of v0.1.0, all MCP tools in this project use a consistent response format through the `createMcpResponse` utility function. This standardization ensures that all tools respond in a predictable way, making it easier to work with responses in client applications.

## Response Structure

### Success Responses

Success responses have the following structure:

```json
{
  "content": [
    {
      "type": "text",
      "text": "{\"status\":\"success\",\"<data-fields>\":\"<values>\"}"
    }
  ]
}
```

Key points:
- The `content` array contains an object with `type: "text"`
- The `text` field contains a JSON string with:
  - `status: "success"` 
  - Additional data fields specific to the tool

Example success response from the `shorten_url` tool:

```json
{
  "content": [
    {
      "type": "text",
      "text": "{\"status\":\"success\",\"shorturl\":\"https://example.com/abc\",\"url\":\"https://example.com\",\"title\":\"Example\"}"
    }
  ]
}
```

### Error Responses

Error responses have the following structure:

```json
{
  "content": [
    {
      "type": "text",
      "text": "{\"status\":\"error\",\"message\":\"<error-message>\",\"<additional-fields>\":\"<values>\"}"
    }
  ],
  "isError": true
}
```

Key points:
- The `content` array contains an object with `type: "text"`
- The `text` field contains a JSON string with:
  - `status: "error"`
  - `message` field with a description of the error
  - Additional context fields specific to the error
- The top-level `isError: true` flag indicates this is an error response

Example error response from the `shorten_url` tool:

```json
{
  "content": [
    {
      "type": "text",
      "text": "{\"status\":\"error\",\"message\":\"This URL appears to be a shortened URL already.\",\"code\":\"error:already_shortened\",\"originalUrl\":\"https://example.com/abc\"}"
    }
  ],
  "isError": true
}
```

## Common Error Types

The system uses consistent error codes across tools:

- `unknown_error`: Generic error when specific type cannot be determined
- `not_found`: Resource (URL, keyword) not found in the database
- `keyword_exists`: Requested keyword is already in use
- `keyword_conflict`: Keyword exists and points to a different URL
- `error:already_shortened`: URL is already shortened (ShortShort plugin error)
- Tool-specific error codes may also be provided

## Working with Responses

When consuming responses from YOURLS-MCP tools:

1. Check for the presence of the `isError` flag to determine if the response represents an error
2. Parse the JSON string in the `content[0].text` field
3. Check the `status` field for "success" or "error"
4. Access the appropriate data fields based on the tool and operation

## Migration Guide

If you were using earlier versions of YOURLS-MCP before this standardization:

1. Update any code that expects different response formats
2. Ensure you're properly parsing the JSON string in the `content[0].text` field
3. Use the `isError` flag to detect errors instead of checking response content structure

## Testing

A test script is provided at `scripts/tests/test-response-format.js` to validate that all tool responses conform to this standardized format.