# YOURLS-MCP Usage Guide

This guide explains how to use YOURLS-MCP with Claude Desktop.

## Setup

1. Ensure you have [Claude Desktop](https://claude.ai/download) installed.

2. Configure Claude Desktop to use the YOURLS-MCP server by editing your configuration file:
   - macOS: `~/Library/Application Support/Claude/config.json`
   - Windows: `%APPDATA%\Claude\config.json`
   - Linux: `~/.config/Claude/config.json`

3. Add the YOURLS-MCP server configuration:
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

4. Restart Claude Desktop to apply the changes.

## Using YOURLS with Claude

Once configured, Claude can interact with your YOURLS instance through natural language. Here are some example prompts and how Claude will respond:

### Shortening a URL

```
You: Can you shorten this URL for me? https://example.com/very/long/path/with/many/parameters?param1=value1&param2=value2

Claude: I'll shorten that URL for you using your YOURLS instance.

The shortened URL is: https://yourdomain.com/abc
```

### Shortening with a Custom Keyword

```
You: Please create a short URL with the keyword "docs" for https://example.com/documentation

Claude: I've created a short URL with the custom keyword "docs" for you.

The shortened URL is: https://yourdomain.com/docs
```

### Expanding a Short URL

```
You: What's the destination of this short URL? https://yourdomain.com/abc

Claude: I'll expand that short URL for you.

The URL https://yourdomain.com/abc redirects to:
https://example.com/very/long/path/with/many/parameters?param1=value1&param2=value2
```

### Getting Click Statistics

```
You: How many clicks has my short URL https://yourdomain.com/abc received?

Claude: Let me check the click statistics for that short URL.

The URL https://yourdomain.com/abc has received 42 clicks since it was created.
```

### Getting Database Statistics

```
You: What are the overall stats for my YOURLS instance?

Claude: Here are the statistics for your YOURLS instance:

Total links: 157
Total clicks: 3,429
```

### Creating Custom Short URLs

```
You: Can you set up a custom URL bysha.pe/web that points to shapescale.com?

Claude: I'll create that custom URL for you.

I've created the custom URL with your specified keyword. The shortened URL is:
https://bysha.pe/web

This now redirects to: https://shapescale.com
```

### Getting Detailed Analytics for a Short URL

```
You: Can you show me the daily click statistics for bysha.pe/docs from January 1-7, 2025?

Claude: Here are the detailed click statistics for bysha.pe/docs from January 1-7, 2025:

Total clicks (lifetime): 87
Clicks in date range: 23

Daily breakdown:
- January 1, 2025: 5 clicks
- January 2, 2025: 8 clicks
- January 3, 2025: 4 clicks
- January 4, 2025: 2 clicks
- January 5, 2025: 0 clicks
- January 6, 2025: 3 clicks
- January 7, 2025: 1 click
```

### Generating QR Codes for Short URLs

```
You: Can you generate a QR code for my short URL bysha.pe/docs?

Claude: I've generated a QR code for your short URL:

[QR Code Image for bysha.pe/docs]

This QR code will direct users to bysha.pe/docs when scanned.

You: Can you make that QR code larger and add more error correction?

Claude: I've generated a larger QR code with high error correction:

[Larger QR Code Image with high error correction for bysha.pe/docs]

This QR code is 300 pixels in size and uses H-level error correction, making it more reliable when printed or displayed in challenging conditions.
```

### Creating Short URLs with Google Analytics Tracking

```
You: Can you create a short URL for our marketing campaign with UTM parameters?

Claude: I'd be happy to create a short URL with Google Analytics tracking parameters. What's the URL and the campaign details?

You: The URL is https://example.com/summer-collection and it's for our email newsletter campaign about our summer launch.

Claude: I'll create a tracked short URL for your summer collection campaign.

I've created a short URL with Google Analytics tracking parameters:

The shortened URL is: https://yourdomain.com/summer

This URL includes the following UTM parameters:
- Source: newsletter
- Medium: email
- Campaign: summer_launch

When users click this link, these parameters will be tracked in your Google Analytics dashboard.
```

## Practical Use Cases

YOURLS-MCP is particularly useful for:

1. **Research Sessions**: When Claude helps you research a topic and finds many long URLs, it can automatically provide shortened versions for easier sharing and reference.

2. **Document Preparation**: When drafting documents that need to include URLs, Claude can suggest shortened versions to make the document cleaner and more readable.

3. **Link Management**: Claude can help organize your shortened links by suggesting keywords based on content and providing analytics on existing links.

4. **Social Media Drafting**: When helping draft social media posts, Claude can provide shortened URLs that fit within character limits.

5. **Marketing Campaigns**: Claude can create shortened URLs with Google Analytics tracking parameters (UTM tags) for your marketing campaigns, making it easy to track the performance of different channels and campaigns.

## Troubleshooting

If Claude cannot connect to your YOURLS instance, check:

1. Your YOURLS server is running and accessible from your machine
2. The API URL in the configuration is correct
3. Your authentication credentials are valid
4. Claude Desktop has been restarted after configuration changes

If errors persist, check the Claude Desktop logs for more detailed error messages related to the MCP server.