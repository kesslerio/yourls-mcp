# YOURLS-MCP

A Model Control Protocol (MCP) server for integrating YOURLS URL shortening with Claude Desktop.

## Overview

YOURLS-MCP creates a bridge between [Claude Desktop](https://claude.ai/download) and your self-hosted [YOURLS](https://yourls.org/) URL shortener instance. When configured, it allows Claude to automatically shorten URLs using your personal YOURLS installation.

## Quick Start

```bash
# Install globally
npm install -g yourls-mcp

# Or run directly with npx
npx yourls-mcp@latest
```

Configure Claude Desktop:
```json
{
  "mcpServers": {
    "yourls": {
      "command": "npx",
      "args": [
        "-y",
        "yourls-mcp@latest"
      ],
      "env": {
        "YOURLS_API_URL": "https://your-yourls-domain.com/yourls-api.php",
        "YOURLS_AUTH_METHOD": "signature",
        "YOURLS_SIGNATURE_TOKEN": "your-secret-signature-token"
      }
    }
  }
}
```

## Features

- Seamless integration with Claude Desktop via MCP
- Shorten URLs directly through Claude
- Expand shortened URLs to see their destination
- Retrieve click statistics for your links
- Custom keyword support
- Secure signature-based authentication
- Environment variable or config file support

## Configuration

You can configure YOURLS-MCP using either:

1. **Environment variables** (recommended for Claude Desktop integration):
   ```
   YOURLS_API_URL=https://your-yourls-domain.com/yourls-api.php
   YOURLS_AUTH_METHOD=signature
   YOURLS_SIGNATURE_TOKEN=your-secret-signature-token
   ```

2. **Configuration file** (YAML):
   ```yaml
   yourls:
     api_url: "https://your-yourls-domain.com/yourls-api.php"
     auth_method: "signature"
     signature_token: "your-secret-signature-token"
   ```

## Usage

Once configured, Claude will be able to use commands like:

- "Shorten this URL for me: https://example.com/long-url"
- "Expand this short URL: https://short.domain/abc"
- "Get stats for this short URL: https://short.domain/abc"

## Development

```bash
# Clone the repository
git clone https://github.com/kesslerio/yourls-mcp.git
cd yourls-mcp

# Install dependencies
npm install

# Start the server
npm start
```

## License

MIT