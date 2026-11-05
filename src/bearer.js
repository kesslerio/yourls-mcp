/**
 * Bearer token authentication for the HTTP transport.
 *
 * Tokens are loaded from a JSON file shaped as:
 *   { "<token>": "<principal>" }
 *
 * Never log token values or Authorization headers.
 */
import fs from 'node:fs';

/**
 * Load the bearer token map from a JSON file.
 *
 * @param {string} filePath - Path to the tokens JSON file
 * @returns {Map<string, string>} Map of token to principal
 * @throws {Error} If the file is missing, unreadable, invalid JSON, or has no tokens
 */
export function loadBearerTokens(filePath) {
  if (!filePath) {
    throw new Error(
      'YOURLS_MCP_BEARER_TOKENS_FILE is not set; the HTTP transport requires bearer tokens ' +
      '(set YOURLS_MCP_ALLOW_UNAUTHENTICATED=1 for unauthenticated local development only).'
    );
  }

  let raw;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    throw new Error(`Unable to read bearer tokens file: ${error.message}`);
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error('Bearer tokens file is not valid JSON');
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Bearer tokens file must contain a JSON object mapping tokens to principals');
  }

  const tokens = new Map();
  for (const [token, principal] of Object.entries(data)) {
    if (!token || typeof principal !== 'string' || principal.length === 0) {
      throw new Error('Bearer tokens file must map non-empty token strings to non-empty principal strings');
    }
    tokens.set(token, principal);
  }

  if (tokens.size === 0) {
    throw new Error('Bearer tokens file contains no tokens; refusing to start unauthenticated');
  }

  return tokens;
}

/**
 * Create Express middleware that requires a valid bearer token.
 * Unauthenticated requests get a bare 401 response with no MCP protocol details.
 *
 * @param {object} options
 * @param {Map<string, string>} [options.tokens] - Token to principal map
 * @param {boolean} [options.allowUnauthenticated=false] - Dev-only bypass
 * @returns {Function} Express middleware
 */
export function createBearerAuthMiddleware({ tokens = null, allowUnauthenticated = false } = {}) {
  if (allowUnauthenticated) {
    return (req, res, next) => next();
  }

  if (!tokens || tokens.size === 0) {
    throw new Error('Bearer tokens are required for the HTTP transport');
  }

  return (req, res, next) => {
    const header = req.headers.authorization;
    const token = header && header.startsWith('Bearer ')
      ? header.slice('Bearer '.length).trim()
      : null;

    const principal = token ? tokens.get(token) : undefined;
    if (principal === undefined) {
      res.set('WWW-Authenticate', 'Bearer');
      res.status(401).json({ error: 'unauthorized' });
      return;
    }

    req.principal = principal;
    next();
  };
}
