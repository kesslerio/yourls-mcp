/**
 * URL Shortening tool implementation
 * 
 * Uses the standardized MCP response format via createMcpResponse utility:
 * - Success: {content: [{type: 'text', text: JSON.stringify({status: 'success', ...data})}]}
 * - Error: {content: [{type: 'text', text: JSON.stringify({status: 'error', ...data})}], isError: true}
 */
import { isShortShortError, createShortShortErrorResponse, createMcpResponse } from '../utils.js';

// Custom keywords must be kebab-case slugs (e.g. "acme-corp-monthly")
const KEBAB_CASE_KEYWORD = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Create a URL shortening tool
 * 
 * @param {object} yourlsClient - YOURLS API client
 * @returns {object} Tool definition with standardized MCP response format
 */
export default function createShortenUrlTool(yourlsClient) {
  return {
    name: 'shorten_url',
    description: 'Shorten a long URL using YOURLS. For the optional keyword, use business-name slugs in kebab-case (the company name, e.g. "acme-corp"); never use a person\'s name. Prefer suffixes like "-monthly", "-annual", or "-demo" for variants. Keywords must match ^[a-z0-9]+(-[a-z0-9]+)*$ and existing keywords are never overwritten.',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The URL to shorten'
        },
        keyword: {
          type: 'string',
          description: 'Optional custom keyword for the short URL'
        },
        title: {
          type: 'string',
          description: 'Optional title for the URL'
        }
      },
      required: ['url']
    },
    execute: async ({ url, keyword, title }) => {
      if (keyword) {
        if (!KEBAB_CASE_KEYWORD.test(keyword)) {
          return createMcpResponse(false, {
            message: `Invalid keyword '${keyword}'. Custom keywords must be kebab-case slugs: lowercase letters and digits separated by single hyphens (e.g. 'acme-corp-monthly').`,
            code: 'invalid_keyword',
            keyword: keyword
          });
        }

        // Check first whether the keyword already resolves so it is never overwritten
        let existing = null;
        try {
          existing = await yourlsClient.expand(keyword);
        } catch {
          // Expansion failure (e.g. keyword not found) means the keyword is free to use
          existing = null;
        }

        if (existing && existing.longurl) {
          return createMcpResponse(false, {
            message: `The keyword '${keyword}' already exists and points to '${existing.longurl}'. Choose a different keyword; existing keywords are never overwritten.`,
            code: 'keyword_exists',
            keyword: keyword,
            shorturl: existing.shorturl || keyword,
            longurl: existing.longurl
          });
        }
      }

      try {
        const result = await yourlsClient.shorten(url, keyword, title);
        
        if (result.shorturl) {
          return createMcpResponse(true, {
            shorturl: result.shorturl,
            url: result.url || url,
            title: result.title || title || ''
          });
        } else {
          return createMcpResponse(false, {
            message: result.message || 'Unknown error',
            code: result.code || 'unknown'
          });
        }
      } catch (error) {
        // Check if this is a ShortShort plugin error (prevents shortening of already-shortened URLs)
        if (isShortShortError(error)) {
          return createMcpResponse(false, createShortShortErrorResponse(url, keyword));
        }
        
        // Handle all other errors
        return createMcpResponse(false, {
          message: error.message,
          code: error.response?.data?.code || 'unknown_error'
        });
      }
    }
  };
}
