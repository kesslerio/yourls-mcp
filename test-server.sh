#!/bin/bash

# Test script for YOURLS-MCP server
export YOURLS_API_URL="https://bysha.pe/yourls-api.php"
export YOURLS_AUTH_METHOD="signature"
export YOURLS_SIGNATURE_TOKEN="44845b557c"

# Run the server
node yourls-mcp.js