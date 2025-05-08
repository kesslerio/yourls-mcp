# YOURLS-MCP Usage Guide

This guide explains how to set up and use the YOURLS-MCP server with Claude Desktop.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/YOURLS-mcp.git
   cd YOURLS-mcp
   ```

2. Install the package:
   ```bash
   pip install -e .
   ```

3. Create a configuration file:
   ```bash
   cp config.sample.yaml config.yaml
   ```

4. Edit the configuration file with your YOURLS details.
   
   For signature-based authentication (recommended for better security):
   ```yaml
   yourls:
     api_url: "https://your-yourls-domain.com/yourls-api.php"
     auth_method: "signature"
     signature_token: "your-secret-signature-token" # From YOURLS admin interface
   ```
   
   Or for username/password authentication:
   ```yaml
   yourls:
     api_url: "https://your-yourls-domain.com/yourls-api.php"
     auth_method: "password"
     username: "your-username"
     password: "your-password"
   ```

## Claude Desktop Configuration

1. Ensure you have Claude Desktop installed from [claude.ai/download](https://claude.ai/download).

2. Configure Claude Desktop to use the YOURLS-MCP server:

   - Find your Claude Desktop configuration file:
     - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
     - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
     - Linux: `~/.config/Claude/claude_desktop_config.json`

   - Add the YOURLS-MCP server configuration:
     ```json
     {
       "mcp_servers": {
         "yourls": {
           "command": "/full/path/to/python",
           "args": [
             "/full/path/to/YOURLS-mcp/yourls_mcp/server.py",
             "--config",
             "/full/path/to/YOURLS-mcp/config.yaml"
           ]
         }
       }
     }
     ```
     
     ⚠️ **Important**: Replace `/full/path/to/python` with the actual path to your Python executable. You can find this with the command `which python3` in your terminal. Also update all file paths to match your system.

3. Restart Claude Desktop.

## Usage in Claude

Once configured, you can ask Claude to shorten URLs using commands like:

- "Please shorten this URL for me: https://example.com/very-long-url"
- "Expand this short URL: https://short.domain/abc"
- "How many clicks has this short URL received: https://short.domain/abc"

Claude will use your YOURLS instance to perform these operations.

## Examples

### Shortening a URL

```
You: Could you shorten this URL for me? https://example.com/very-long-path-with-many-parameters?param1=value1&param2=value2

Claude: I'll shorten that URL for you using your YOURLS instance.

The shortened URL is: https://short.domain/abc
```

### Expanding a URL

```
You: Where does this short URL lead to? https://short.domain/abc

Claude: I'll check where that URL leads to.

The short URL https://short.domain/abc redirects to:
https://example.com/very-long-path-with-many-parameters?param1=value1&param2=value2
```

### Getting URL statistics

```
You: How many clicks has https://short.domain/abc received?

Claude: Let me check the statistics for that short URL.

The URL https://short.domain/abc has received 42 clicks.
```

## Troubleshooting

If you encounter issues:

1. Check that your YOURLS instance is accessible and that your API credentials are correct.
2. Verify that Claude Desktop is correctly configured with the MCP server.
3. Ensure the `config.yaml` file has the correct settings.
4. Check Claude Desktop logs for any error messages related to the MCP server.