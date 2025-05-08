# YOURLS-MCP

A Model Control Protocol (MCP) server for integrating YOURLS URL shortening with Claude Desktop.

**Author:** Martin Kessler

## Overview

YOURLS-MCP creates a bridge between [Claude Desktop](https://claude.ai/download) and your self-hosted [YOURLS](https://yourls.org/) URL shortener instance. When configured, it allows Claude to automatically shorten URLs using your personal YOURLS installation.

## Features

- Shorten URLs using your YOURLS instance
- Create custom short URLs with specific keywords
- **Duplicate URL Handling:** Create multiple short URLs for the same destination URL (unique to YOURLS-MCP)
- Expanded URL information and statistics
- Database statistics
- Intelligent fallbacks for plugins
- Comprehensive documentation and testing tools

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/kesslerio/yourls-mcp.git
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

### Core Tools

#### 1. shorten_url

Shortens a long URL using your YOURLS instance.

**Parameters:**
- `url` (required): The long URL to shorten
- `keyword` (optional): Custom keyword for the short URL
- `title` (optional): Title for the URL

#### 2. expand_url

Expands a short URL to get the original long URL.

**Parameters:**
- `shorturl` (required): The short URL or keyword to expand

#### 3. url_stats

Gets statistics for a shortened URL.

**Parameters:**
- `shorturl` (required): The short URL or keyword to get stats for

#### 4. db_stats

Gets global statistics for your YOURLS instance.

**Parameters:** None

#### 5. create_custom_url

Creates a custom short URL with a specific keyword, even for URLs that already exist in the database.

**Parameters:**
- `url` (required): The target URL to shorten
- `keyword` (required): The custom keyword for the short URL (e.g., "web" for bysha.pe/web)
- `title` (optional): Title for the URL
- `bypass_shortshort` (optional): Whether to bypass the ShortShort plugin that prevents shortening already-shortened URLs (default: false)
- `force_url_modification` (optional): Whether to force using URL modification approach to create multiple short URLs for the same destination (default: false)

#### 6. shorten_with_analytics

Shortens a long URL with Google Analytics UTM parameters.

**Parameters:**
- `url` (required): The URL to shorten
- `source` (required): UTM source parameter - identifies the source of traffic (e.g., "google", "newsletter", "twitter")
- `medium` (required): UTM medium parameter - identifies the marketing medium (e.g., "cpc", "social", "email")
- `campaign` (required): UTM campaign parameter - identifies the specific campaign (e.g., "summer_sale", "product_launch")
- `term` (optional): UTM term parameter - identifies paid search terms
- `content` (optional): UTM content parameter - differentiates ads or links pointing to the same URL
- `keyword` (optional): Custom keyword for the short URL
- `title` (optional): Title for the URL

### Plugin-based Tools

#### 7. url_analytics

Gets detailed click analytics for a short URL within a date range.
*Requires the API ShortURL Analytics plugin to be installed.*

**Parameters:**
- `shorturl` (required): The short URL or keyword to get analytics for
- `date` (required): Start date for analytics in YYYY-MM-DD format
- `date_end` (optional): End date for analytics in YYYY-MM-DD format (defaults to start date if not provided)

#### 8. contract_url

Check if a URL has already been shortened without creating a new short URL.
*Requires the API Contract plugin to be installed.*

**Parameters:**
- `url` (required): The URL to check if it has been shortened

#### 9. update_url

Update an existing short URL to point to a different destination URL.
*Requires the API Edit URL plugin to be installed.*

**Parameters:**
- `shorturl` (required): The short URL or keyword to update
- `url` (required): The new destination URL
- `title` (optional): Optional new title ("keep" to keep existing, "auto" to fetch from URL)

#### 10. change_keyword

Change the keyword of an existing short URL.
*Requires the API Edit URL plugin to be installed.*

**Parameters:**
- `oldshorturl` (required): The existing short URL or keyword
- `newshorturl` (required): The new keyword to use
- `url` (optional): Optional URL (if not provided, will use the URL from oldshorturl)
- `title` (optional): Optional new title ("keep" to keep existing, "auto" to fetch from URL)

#### 11. get_url_keyword

Get the keyword(s) for a long URL.
*Requires the API Edit URL plugin to be installed.*

**Parameters:**
- `url` (required): The long URL to look up
- `exactly_one` (optional): If false, returns all keywords for this URL (default: true)

#### 12. delete_url

Delete a short URL.
*Requires the API Delete plugin to be installed.*

**Parameters:**
- `shorturl` (required): The short URL or keyword to delete

#### 13. list_urls

Get a list of URLs with sorting, pagination, and filtering options.
*Requires the API List Extended plugin to be installed.*

**Parameters:**
- `sortby` (optional): Field to sort by (keyword, url, title, ip, timestamp, clicks) (default: timestamp)
- `sortorder` (optional): Sort order (ASC or DESC) (default: DESC)
- `offset` (optional): Pagination offset (default: 0)
- `perpage` (optional): Number of results per page (default: 50)
- `query` (optional): Optional search query for filtering by keyword
- `fields` (optional): Fields to return (keyword, url, title, timestamp, ip, clicks) (default: all fields)

#### 14. generate_qr_code

Generate a QR code for a shortened URL.
*Requires the YOURLS-IQRCodes plugin to be installed.*

**Parameters:**
- `shorturl` (required): The short URL or keyword to generate a QR code for
- `size` (optional): QR code size in pixels
- `border` (optional): Border width around the QR code
- `ecc` (optional): Error correction level: L (low), M (medium), Q (quartile), or H (high)
- `format` (optional): Image format (png, jpg, svg, etc.)

## Usage Examples

Once configured, Claude will be able to use the YOURLS tools with prompts like:

### Core Feature Examples

- "Shorten this URL for me: https://example.com/very-long-url-that-needs-shortening"
- "Create a short URL with the keyword 'docs' for https://example.com/documentation"
- "Set up a custom URL bysha.pe/web that points to shapescale.com"
- "Create a custom short URL for our documentation using the keyword 'docs'"
- "Create multiple keywords (docs, docs2, docs3) for the same documentation URL"
- "Create a short URL for our campaign with UTM tracking parameters"
- "Shorten this marketing URL with Google Analytics tracking: source=newsletter, medium=email, campaign=summer_launch"
- "Expand this short URL: https://yourdomain.com/abc"
- "How many clicks does my short URL https://yourdomain.com/abc have?"
- "Show me the statistics for my YOURLS instance"

### Plugin-based Feature Examples

- "Give me detailed analytics for shorturl 'abc' for January 2025"
- "Show me the click statistics for bysha.pe/abc from 2025-01-01 to 2025-01-31"
- "What was the daily traffic for my shortURL 'web' last month?"
- "Check if this URL has already been shortened: https://example.com/page"
- "Has someone already created a short URL for https://example.com/page?"
- "Update the destination of the short URL 'docs' to point to https://example.com/new-documentation"
- "Change where the keyword 'docs' points to"
- "Rename the short URL 'docs' to 'documentation'"
- "Change the keyword of my short URL from 'docs' to 'documentation'"
- "What is the keyword for this long URL: https://example.com/page?"
- "List all the short URLs for https://example.com/page"
- "Delete the short URL 'docs'"
- "Remove the keyword 'docs' from my YOURLS instance"
- "Show me the most recent 10 short URLs in my YOURLS database"
- "List all the short URLs sorted by number of clicks"
- "Search for short URLs containing 'product'"
- "Generate a QR code for my short URL 'docs'"
- "Create a QR code for bysha.pe/web"
- "Give me a QR code for my product page with high error correction"
- "I need a larger QR code for the 'landing' shorturl, make it 300 pixels"
- "Generate a SVG QR code for our documentation link"

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

## Duplicate URL Handling

YOURLS-MCP offers a unique ability to create multiple short URLs for the same destination URL, which is not natively supported in YOURLS. For detailed information about this feature, see [Duplicate URL Handling Documentation](./docs/duplicate-url-feature.md).

Two approaches are supported:

1. **Plugin Approach** (recommended): Uses the included Force Allow Duplicates plugin to create true duplicate URLs
2. **URL Modification Approach** (fallback): Adds timestamp parameters to make each URL technically unique while preserving functionality

The system automatically selects the appropriate approach based on your YOURLS setup.

## Compatibility with YOURLS Plugins

YOURLS-MCP is designed to work with both standard YOURLS installations and various plugins, with built-in fallbacks when plugins are not available:

### Supported Plugins with Fallbacks

YOURLS-MCP includes intelligent fallbacks for extended functionality when plugins are not installed:

- **API ShortURL Analytics**: For detailed click statistics with date ranges
  - *Fallback behavior*: Provides basic click statistics through core YOURLS API when the plugin is not available

- **API Contract**: To check if URLs exist without creating them
  - *Fallback behavior*: Uses core YOURLS stats API to search for existing URLs with filtering

- **API Edit URL**: For updating short URLs and changing keywords
  - *Fallback behavior*: 
    - For updating URLs: Attempts to re-create the URL with the same keyword
    - For changing keywords: Creates a new short URL with the new keyword (old one remains, as deletion requires API Delete plugin)
    - For getting URL keywords: Uses core YOURLS stats API with filtering

- **API Delete**: For removing short URLs
  - *Fallback behavior*: Limited - provides information that deletion requires the plugin, as core YOURLS API doesn't support deletion

- **API List Extended**: For enhanced URL listing with sorting and filtering
  - *Fallback behavior*: Uses core YOURLS stats API with client-side sorting and pagination

- **YOURLS-IQRCodes**: For generating QR codes from short URLs
  - *Fallback behavior*: None - requires the plugin to be installed

- **ShortShort**: Properly handles the error when trying to shorten an already shortened URL
  - *Compatibility*: Error handling works regardless of whether plugin is installed

- **Allow Existing URLs**: Modifies how YOURLS handles duplicate URLs
  - *Plugin URL*: https://github.com/elder-oss/yourls-allow-existing-urls
  - *Note*: This plugin changes error responses to success responses but doesn't actually create new short URLs for existing destination URLs
  - *Our solution*: YOURLS-MCP implements a URL modification approach that adds a timestamp parameter to make URLs unique in the database while preserving the user experience
  - *Installation*: Optional - our URL modification approach works with or without this plugin installed

- **Force Allow Duplicates**: Truly enables creating multiple short URLs for the same destination URL
  - *Plugin Repository*: https://github.com/kesslerio/yourls-force-allow-duplicates (coming soon)
  - *Description*: Custom plugin that bypasses YOURLS' unique URL constraint
  - *Usage*: Add `force=1` to your API requests or use `force_url_modification=false` with the `create_custom_url` tool
  - *Installation*: 
    1. Download from the plugin repository
    2. Copy the `force-allow-duplicates` folder to your `YOURLS/user/plugins/` directory
    3. Activate the plugin in your YOURLS admin interface

### Fallback Mechanism

When a plugin-dependent feature is used but the plugin is not installed, YOURLS-MCP:

1. Automatically detects missing plugins
2. Provides appropriate fallback functionality where possible
3. Includes a `fallback_used: true` attribute in responses when fallbacks are activated
4. Adds `fallback_limitations` information when the fallback has reduced functionality
5. For completely unsupported operations, returns informative error messages

This approach ensures that YOURLS-MCP works with as many YOURLS installations as possible, while still providing clear information about enhanced functionality available with plugins.

## Development and Testing

### Test Scripts

The project includes various test scripts in the `tests/integration/` directory:

- **URL Shortening Tests**:
  - `test-custom-url.js`: Tests creating custom URLs with specific keywords
  - `test-url-modification.js`: Tests URL modification approach for handling duplicate URLs
  - `test-plugin-behavior.js`: Tests the behavior of the Allow Existing URLs plugin

- **Plugin Tests**:
  - `test-duplicate-urls.js`: Tests creating duplicate URLs with different keywords
  - `test-plugin-approach.js`: Tests direct plugin approach for handling duplicates

- **Running Tests**:
  ```bash
  # Run a specific test
  node tests/integration/test-custom-url.js
  ```

### Utility Scripts

The `scripts/` directory contains utility scripts for common operations:

- `create-random.js`: Creates a random short URL for a specified destination
- Other scripts for specific URL creation tasks

## License

MIT

## About

YOURLS-MCP was created by Martin Kessler to integrate YOURLS with Claude Desktop and other Claude offerings via the Model Context Protocol (MCP).

The Force Allow Duplicates plugin was developed to solve the challenge of creating multiple short URLs for the same destination, which is not natively supported in YOURLS.

For support, issues, or feature requests:
- YOURLS-MCP: https://github.com/kesslerio/yourls-mcp/issues
- Force Allow Duplicates plugin: https://github.com/kesslerio/yourls-force-allow-duplicates/issues (once repository is created)