# YOURLS-MCP

A Model Control Protocol (MCP) server for integrating YOURLS URL shortening with Claude Desktop.

## Overview

YOURLS-MCP creates a bridge between [Claude Desktop](https://claude.ai/download) and your self-hosted [YOURLS](https://yourls.org/) URL shortener instance. When configured, it allows Claude to automatically shorten URLs using your personal YOURLS installation.

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/yourls-mcp.git
cd yourls-mcp

# Install dependencies
npm install
```

### Configuration

Create a Claude Desktop configuration file that points to your YOURLS-MCP installation:

```json
{
  "mcpServers": {
    "yourls": {
      "command": "node",
      "args": [
        "/full/path/to/yourls-mcp/yourls-mcp.js"
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

Save this file to your Claude Desktop configuration directory, which is typically:
- macOS: `~/Library/Application Support/Claude/config.json`
- Windows: `%APPDATA%\Claude\config.json`
- Linux: `~/.config/Claude/config.json`

## Features

- Seamless integration with Claude Desktop via MCP
- Shorten URLs directly through Claude
- Expand shortened URLs to see their destination
- Retrieve click statistics for your links
- Custom keyword support
- Secure signature-based authentication
- Environment variable configuration

## Configuration Options

The following environment variables can be set in the Claude Desktop config:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `YOURLS_API_URL` | URL to your YOURLS API endpoint | - | Yes |
| `YOURLS_AUTH_METHOD` | Authentication method (`signature` or `password`) | `signature` | No |
| `YOURLS_SIGNATURE_TOKEN` | Secret token for signature-based auth | - | Yes (if using signature auth) |
| `YOURLS_USERNAME` | Username for password-based auth | - | Yes (if using password auth) |
| `YOURLS_PASSWORD` | Password for password-based auth | - | Yes (if using password auth) |
| `YOURLS_SIGNATURE_TTL` | Time-to-live for signatures in seconds | 43200 (12 hours) | No |

## Available MCP Tools

YOURLS-MCP provides the following tools to Claude:

### 1. shorten_url

Shortens a long URL using your YOURLS instance.

**Parameters:**
- `url` (required): The long URL to shorten
- `keyword` (optional): Custom keyword for the short URL
- `title` (optional): Title for the URL

### 2. expand_url

Expands a short URL to get the original long URL.

**Parameters:**
- `shorturl` (required): The short URL or keyword to expand

### 3. url_stats

Gets statistics for a shortened URL.

**Parameters:**
- `shorturl` (required): The short URL or keyword to get stats for

### 4. db_stats

Gets global statistics for your YOURLS instance.

**Parameters:** None

### 5. create_custom_url

Creates a custom short URL with a specific keyword.

**Parameters:**
- `url` (required): The target URL to shorten
- `keyword` (required): The custom keyword for the short URL (e.g., "web" for bysha.pe/web)
- `title` (optional): Title for the URL

## Usage Examples

Once configured, Claude will be able to use the YOURLS tools with prompts like:

- "Shorten this URL for me: https://example.com/very-long-url-that-needs-shortening"
- "Create a short URL with the keyword 'docs' for https://example.com/documentation"
- "Set up a custom URL bysha.pe/web that points to shapescale.com"
- "Create a custom short URL for our documentation using the keyword 'docs'"
- "Expand this short URL: https://yourdomain.com/abc"
- "How many clicks does my short URL https://yourdomain.com/abc have?"
- "Show me the statistics for my YOURLS instance"

## Development

```bash
# Clone the repository
git clone https://github.com/kesslerio/yourls-mcp.git
cd yourls-mcp

# Install dependencies
npm install

# For local testing, create a claude-local-config.json file:
{
  "mcpServers": {
    "yourls": {
      "command": "node",
      "args": [
        "/full/path/to/yourls-mcp/yourls-mcp.js"
      ],
      "env": {
        "YOURLS_API_URL": "https://your-yourls-domain.com/yourls-api.php",
        "YOURLS_AUTH_METHOD": "signature",
        "YOURLS_SIGNATURE_TOKEN": "your-secret-signature-token"
      }
    }
  }
}

# Start the server directly (for testing)
node yourls-mcp.js
```

## How It Works

YOURLS-MCP acts as a bridge between Claude Desktop and your YOURLS instance:

1. Claude Desktop launches the YOURLS-MCP server when needed
2. The server reads the configuration from environment variables
3. When Claude invokes a tool, the server makes the appropriate API calls to your YOURLS instance
4. Results are returned to Claude in a structured format

The server uses the Model Context Protocol (MCP) standard to communicate with Claude Desktop, allowing seamless integration and natural language interactions with your URL shortener.

## License

MIT