# YOURLS-MCP

A Model Control Protocol (MCP) server for integrating YOURLS URL shortening with Claude Desktop.

## Overview

YOURLS-MCP creates a bridge between [Claude Desktop](https://claude.ai/download) and your self-hosted [YOURLS](https://yourls.org/) URL shortener instance. When configured, it allows Claude to automatically shorten URLs using your personal YOURLS installation.

> **Note**: This repository does not include the YOURLS source code. The YOURLS directory is referenced for development purposes but is not tracked in this repository. You should have your own YOURLS installation to use with this MCP server.

## Features

- Seamless integration with Claude Desktop via MCP
- Shorten URLs directly through Claude
- Expand shortened URLs to see their destination
- Retrieve click statistics for your links
- Custom keyword support

## Requirements

- Python 3.8+
- A running YOURLS instance with API access
- Claude Desktop with MCP support

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/YOURLS-mcp.git
cd YOURLS-mcp

# Install dependencies
pip install -r requirements.txt
```

## Configuration

1. Copy `config.sample.yaml` to `config.yaml`
2. Edit `config.yaml` with your YOURLS instance details:
   
   For signature-based authentication (recommended):
   ```yaml
   yourls:
     api_url: "https://your-yourls-domain.com/yourls-api.php"
     auth_method: "signature"
     signature_token: "your-signature-token"
   ```
   
   Or for username/password authentication:
   ```yaml
   yourls:
     api_url: "https://your-yourls-domain.com/yourls-api.php"
     auth_method: "password"
     username: "your-username"
     password: "your-password" 
   ```

3. Configure Claude Desktop to use this MCP server by adding to your `claude_desktop_config.json`:
   ```json
   {
     "mcp_servers": {
       "yourls": {
         "command": ["python", "/path/to/YOURLS-mcp/yourls_mcp/server.py"],
         "args": ["--config", "/path/to/YOURLS-mcp/config.yaml"]
       }
     }
   }
   ```

## Usage

Once configured, Claude will be able to use commands like:

- Shorten a URL
- Expand a shortened URL
- Get stats for a short URL

## Development

This project is under active development. Contributions are welcome!

## License

MIT