# YOURLS-MCP Node.js Version

This is a Node.js implementation of the YOURLS-MCP server, which may be easier to set up and run than the Python version.

## Requirements

- Node.js 16+ and npm
- A running YOURLS instance with API access
- Claude Desktop with MCP support

## Installation

You can run the Node.js version without installing any dependencies locally using `npx`:

```bash
# Just make sure the script is executable
chmod +x yourls-mcp.js
```

## Configuration

1. Copy `config.sample.yaml` to `config.yaml` if you haven't already
2. Edit `config.yaml` with your YOURLS instance details (same format as the Python version)
   
3. Configure Claude Desktop to use the Node.js MCP server:

   Edit your Claude Desktop config file (typically at `~/Library/Application Support/Claude/claude_desktop_config.json`):

   ```json
   {
     "mcp_servers": {
       "yourls": {
         "command": "npx",
         "args": [
           "-y",
           "--quiet",
           "@modelcontextprotocol/sdk", 
           "node",
           "/full/path/to/YOURLS-mcp/yourls-mcp.js",
           "--config",
           "/full/path/to/YOURLS-mcp/config.yaml"
         ]
       }
     }
   }
   ```

   ⚠️ **Important**: Replace `/full/path/to/` with the actual full path to your YOURLS-mcp directory.

4. Restart Claude Desktop

## Usage

The usage is the same as the Python version. Once configured, Claude will be able to:

- Shorten URLs
- Expand shortened URLs
- Get stats for a short URL

## Troubleshooting

If you encounter issues:

1. Make sure you have Node.js installed (check with `node --version`)
2. Verify that `npx` is available in your PATH
3. Try running the server manually to check for errors:
   ```bash
   node yourls-mcp.js
   ```
4. Check the Claude Desktop logs for any error messages