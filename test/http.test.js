import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { startHttpServer } from '../src/http.js';
import { buildMcpServer, createServer } from '../src/index.js';
import { loadBearerTokens } from '../src/bearer.js';

const TOKEN = 'test-token-for-http-suite';
const TOKEN_B = 'second-token-for-http-suite';

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yourls-mcp-http-'));
const tokensFile = path.join(tmpDir, 'tokens.json');
fs.writeFileSync(tokensFile, JSON.stringify({ [TOKEN]: 'team-bot', [TOKEN_B]: 'other-bot' }));

function mockYourlsClient() {
  return {
    expand: async () => {
      const error = new Error('short URL not found');
      error.response = { status: 404 };
      throw error;
    },
    shorten: async (url, keyword, title) => ({
      status: 'success',
      shorturl: `https://s.example/${keyword || 'auto'}`,
      url,
      title: title || ''
    }),
    urlStats: async () => ({ link: { clicks: 7, title: 'Example', url: 'https://example.com' } })
  };
}

function parseSseMessages(text) {
  return text
    .split('\n')
    .filter(line => line.startsWith('data:'))
    .map(line => JSON.parse(line.slice('data:'.length).trim()));
}

const mcpHeaders = (sessionId, token = TOKEN) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
  Accept: 'application/json, text/event-stream',
  ...(sessionId ? { 'Mcp-Session-Id': sessionId } : {})
});

async function initializeSession(base) {
  const res = await fetch(`${base}/mcp`, {
    method: 'POST',
    headers: mcpHeaders(),
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-03-26',
        capabilities: {},
        clientInfo: { name: 'test-client', version: '0.0.0' }
      }
    })
  });
  assert.equal(res.status, 200);
  const sessionId = res.headers.get('mcp-session-id');
  assert.ok(sessionId, 'initialize response must carry an mcp-session-id header');
  await res.text();

  const notify = await fetch(`${base}/mcp`, {
    method: 'POST',
    headers: mcpHeaders(sessionId),
    body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' })
  });
  assert.equal(notify.status, 202);
  await notify.text();

  return sessionId;
}

async function rpc(base, sessionId, method, params = {}) {
  const res = await fetch(`${base}/mcp`, {
    method: 'POST',
    headers: mcpHeaders(sessionId),
    body: JSON.stringify({ jsonrpc: '2.0', id: 2, method, params })
  });
  const messages = parseSseMessages(await res.text());
  return { status: res.status, messages, result: messages[0]?.result };
}

let listener;
let base;

before(async () => {
  listener = startHttpServer({
    port: 0,
    bind: '127.0.0.1',
    createMcpServer: () => buildMcpServer(mockYourlsClient(), {
      allowedTools: ['shorten_url', 'expand_url', 'url_stats']
    }),
    tokens: loadBearerTokens(tokensFile)
  });
  await new Promise(resolve => listener.httpServer.on('listening', resolve));
  base = `http://127.0.0.1:${listener.httpServer.address().port}`;
});

after(async () => {
  await listener.close();
});

test('POST /mcp without Authorization returns 401 with no MCP body leak', async () => {
  const res = await fetch(`${base}/mcp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} })
  });
  assert.equal(res.status, 401);
  const body = await res.json();
  assert.deepEqual(body, { error: 'unauthorized' });
});

test('POST /mcp with an unknown bearer token returns 401', async () => {
  const res = await fetch(`${base}/mcp`, {
    method: 'POST',
    headers: { Authorization: 'Bearer not-a-real-token', 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} })
  });
  assert.equal(res.status, 401);
  assert.deepEqual(await res.json(), { error: 'unauthorized' });
});

test('GET and DELETE /mcp require auth too', async () => {
  for (const method of ['GET', 'DELETE']) {
    const res = await fetch(`${base}/mcp`, { method });
    assert.equal(res.status, 401, method);
  }
});

test('non-/mcp paths return 404', async () => {
  for (const path of ['/', '/health', '/sse', '/mcp/extra']) {
    const res = await fetch(`${base}${path}`, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    assert.equal(res.status, 404, path);
  }
});

test('non-/mcp paths 404 even without auth', async () => {
  const res = await fetch(`${base}/other`);
  assert.equal(res.status, 404);
});

test('POST /mcp non-initialize request without session returns 400', async () => {
  const res = await fetch(`${base}/mcp`, {
    method: 'POST',
    headers: mcpHeaders(),
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' })
  });
  assert.equal(res.status, 400);
});

test('GET and DELETE /mcp without a session id return 400', async () => {
  for (const method of ['GET', 'DELETE']) {
    const res = await fetch(`${base}/mcp`, { method, headers: mcpHeaders() });
    assert.equal(res.status, 400, method);
  }
});

test('requests with an unknown session id return 404', async () => {
  for (const method of ['GET', 'DELETE']) {
    const res = await fetch(`${base}/mcp`, { method, headers: mcpHeaders('no-such-session') });
    assert.equal(res.status, 404, method);
  }

  const res = await fetch(`${base}/mcp`, {
    method: 'POST',
    headers: mcpHeaders('no-such-session'),
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' })
  });
  assert.equal(res.status, 404);
});

test('initialize + tools/list returns exactly the allowlisted tools', async () => {
  const sessionId = await initializeSession(base);
  const { result } = await rpc(base, sessionId, 'tools/list');
  assert.ok(result, 'tools/list must return a result');
  const names = result.tools.map(tool => tool.name).sort();
  assert.deepEqual(names, ['expand_url', 'shorten_url', 'url_stats']);

  const shorten = result.tools.find(tool => tool.name === 'shorten_url');
  assert.match(shorten.description, /kebab-case/i);
  assert.match(shorten.description, /person's name/i);
});

test('tools/call shorten_url rejects non-kebab keyword over HTTP', async () => {
  const sessionId = await initializeSession(base);
  const { result } = await rpc(base, sessionId, 'tools/call', {
    name: 'shorten_url',
    arguments: { url: 'https://example.com', keyword: 'Jane Doe' }
  });
  assert.equal(result.isError, true);
  const body = JSON.parse(result.content[0].text);
  assert.equal(body.code, 'invalid_keyword');
});

test('tools/call shorten_url succeeds for a free kebab-case keyword', async () => {
  const sessionId = await initializeSession(base);
  const { result } = await rpc(base, sessionId, 'tools/call', {
    name: 'shorten_url',
    arguments: { url: 'https://example.com', keyword: 'acme-corp-annual' }
  });
  const body = JSON.parse(result.content[0].text);
  assert.equal(body.status, 'success');
  assert.equal(body.shorturl, 'https://s.example/acme-corp-annual');
});

test('session is bound to the bearer principal that created it', async () => {
  const sessionId = await initializeSession(base);

  const res = await fetch(`${base}/mcp`, {
    method: 'POST',
    headers: mcpHeaders(sessionId, TOKEN_B),
    body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list' })
  });
  assert.equal(res.status, 403);
  assert.deepEqual(await res.json(), { error: 'forbidden' });

  for (const method of ['GET', 'DELETE']) {
    const denied = await fetch(`${base}/mcp`, { method, headers: mcpHeaders(sessionId, TOKEN_B) });
    assert.equal(denied.status, 403, method);
    assert.deepEqual(await denied.json(), { error: 'forbidden' });
  }

  // The forbidden DELETE must not have torn the session down
  const { result } = await rpc(base, sessionId, 'tools/list');
  assert.ok(result, 'session must still be usable by its owner');
});

test('tools/call for a non-registered tool fails', async () => {
  const sessionId = await initializeSession(base);
  const res = await fetch(`${base}/mcp`, {
    method: 'POST',
    headers: mcpHeaders(sessionId),
    body: JSON.stringify({
      jsonrpc: '2.0', id: 3, method: 'tools/call',
      params: { name: 'delete_url', arguments: { shorturl: 'x' } }
    })
  });
  const messages = parseSseMessages(await res.text());
  assert.ok(messages[0].error, 'expected a JSON-RPC error for unregistered tool');
});

test('DELETE /mcp tears down the session', async () => {
  const sessionId = await initializeSession(base);
  const del = await fetch(`${base}/mcp`, { method: 'DELETE', headers: mcpHeaders(sessionId) });
  assert.equal(del.status, 200);
  await del.text();

  const res = await fetch(`${base}/mcp`, {
    method: 'POST',
    headers: mcpHeaders(sessionId),
    body: JSON.stringify({ jsonrpc: '2.0', id: 4, method: 'tools/list' })
  });
  assert.equal(res.status, 404);
});

test('createServer http mode is a hard startup error without bearer tokens', () => {
  const env = { ...process.env };
  try {
    process.env.YOURLS_API_URL = 'https://example.invalid/yourls-api.php';
    process.env.YOURLS_AUTH_METHOD = 'signature';
    process.env.YOURLS_SIGNATURE_TOKEN = 'dummy';
    delete process.env.YOURLS_MCP_BEARER_TOKENS_FILE;
    delete process.env.YOURLS_MCP_ALLOW_UNAUTHENTICATED;

    assert.throws(
      () => createServer({ transport: 'http', port: 0, bind: '127.0.0.1' }),
      /BEARER_TOKENS_FILE is not set/
    );
    assert.throws(
      () => createServer({ transport: 'http', port: 0, bind: '127.0.0.1', bearerTokensFile: path.join(tmpDir, 'missing.json') }),
      /Unable to read bearer tokens file/
    );
  } finally {
    process.env = env;
  }
});

test('createServer http mode starts with allowUnauthenticated dev flag', async () => {
  const env = { ...process.env };
  try {
    process.env.YOURLS_API_URL = 'https://example.invalid/yourls-api.php';
    process.env.YOURLS_AUTH_METHOD = 'signature';
    process.env.YOURLS_SIGNATURE_TOKEN = 'dummy';
    delete process.env.YOURLS_MCP_BEARER_TOKENS_FILE;

    const server = createServer({
      transport: 'http',
      port: 0,
      bind: '127.0.0.1',
      allowedTools: ['shorten_url'],
      allowUnauthenticated: true
    });
    const httpServer = server.listen();
    await new Promise(resolve => httpServer.on('listening', resolve));
    const url = `http://127.0.0.1:${httpServer.address().port}`;

    const res = await fetch(`${url}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
      body: JSON.stringify({
        jsonrpc: '2.0', id: 1, method: 'initialize',
        params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 't', version: '0' } }
      })
    });
    assert.equal(res.status, 200);
    assert.ok(res.headers.get('mcp-session-id'));
    await res.text();
    httpServer.close();
  } finally {
    process.env = env;
  }
});
