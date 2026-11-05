/**
 * Streamable HTTP transport for YOURLS-MCP.
 *
 * Serves MCP at POST/GET/DELETE /mcp only, behind bearer auth,
 * with stateful sessions following the SDK streamable HTTP pattern.
 */
import { randomUUID } from 'node:crypto';
import express from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { createBearerAuthMiddleware } from './bearer.js';

function sendJsonRpcError(res, status, message) {
  res.status(status).json({
    jsonrpc: '2.0',
    error: { code: -32000, message },
    id: null
  });
}

/**
 * Start the HTTP listener for MCP.
 *
 * @param {object} options
 * @param {number} [options.port=3133] - Port to listen on
 * @param {string} [options.bind='127.0.0.1'] - Address to bind
 * @param {Function} options.createMcpServer - Factory returning a fresh McpServer per session
 * @param {Map<string, string>} [options.tokens] - Bearer token to principal map
 * @param {boolean} [options.allowUnauthenticated=false] - Dev-only auth bypass
 * @returns {{app: object, httpServer: object, transports: Map, close: Function}}
 */
export function startHttpServer({
  port = 3133,
  bind = '127.0.0.1',
  createMcpServer,
  tokens = null,
  allowUnauthenticated = false
}) {
  if (typeof createMcpServer !== 'function') {
    throw new Error('startHttpServer requires a createMcpServer factory');
  }

  const requireAuth = createBearerAuthMiddleware({ tokens, allowUnauthenticated });
  const transports = new Map();

  const app = express();
  app.disable('x-powered-by');

  app.post('/mcp', requireAuth, express.json(), async (req, res) => {
    const sessionId = req.headers['mcp-session-id'];
    let transport;

    if (sessionId && transports.has(sessionId)) {
      transport = transports.get(sessionId);
    } else if (!sessionId && isInitializeRequest(req.body)) {
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sid) => {
          transports.set(sid, transport);
        }
      });

      const server = createMcpServer();
      await server.connect(transport);

      // server.connect() replaces transport.onclose with the protocol's own
      // handler, so wrap it afterwards to also drop the session from the map.
      const connectedOnClose = transport.onclose;
      transport.onclose = () => {
        connectedOnClose?.();
        if (transport.sessionId) {
          transports.delete(transport.sessionId);
        }
      };
    } else {
      sendJsonRpcError(res, 400, 'Bad Request: no valid session ID or initialize request');
      return;
    }

    await transport.handleRequest(req, res, req.body);
  });

  const handleSessionRequest = async (req, res) => {
    const sessionId = req.headers['mcp-session-id'];
    const transport = sessionId ? transports.get(sessionId) : undefined;
    if (!transport) {
      sendJsonRpcError(res, 400, 'Bad Request: invalid or missing session ID');
      return;
    }
    await transport.handleRequest(req, res);
  };

  app.get('/mcp', requireAuth, handleSessionRequest);
  app.delete('/mcp', requireAuth, handleSessionRequest);

  // Only /mcp is served; everything else is a 404
  app.use((req, res) => {
    res.status(404).json({ error: 'not_found' });
  });

  app.use((err, req, res, next) => {
    if (res.headersSent) {
      next(err);
      return;
    }
    res.status(400).json({ error: 'bad_request' });
  });

  const httpServer = app.listen(port, bind);

  return {
    app,
    httpServer,
    transports,
    close: () => new Promise((resolve, reject) => {
      httpServer.close((err) => (err ? reject(err) : resolve()));
    })
  };
}
