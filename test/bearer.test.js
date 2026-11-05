import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadBearerTokens, createBearerAuthMiddleware } from '../src/bearer.js';

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yourls-mcp-bearer-'));

const writeFile = (contents) => {
  const file = path.join(tmpDir, `tokens-${Math.random().toString(36).slice(2)}.json`);
  fs.writeFileSync(file, contents);
  return file;
};

const mockRes = () => {
  const res = {
    statusCode: 200,
    headers: {},
    body: undefined,
    set(key, value) { this.headers[key] = value; return this; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; }
  };
  return res;
};

test('loadBearerTokens loads a token to principal map', () => {
  const file = writeFile(JSON.stringify({ 'tok-abc': 'team-bot', 'tok-def': 'ci-runner' }));
  const tokens = loadBearerTokens(file);
  assert.equal(tokens.get('tok-abc'), 'team-bot');
  assert.equal(tokens.get('tok-def'), 'ci-runner');
  assert.equal(tokens.size, 2);
});

test('loadBearerTokens throws when no path is configured', () => {
  assert.throws(() => loadBearerTokens(undefined), /BEARER_TOKENS_FILE is not set/);
});

test('loadBearerTokens throws on unreadable file', () => {
  assert.throws(
    () => loadBearerTokens(path.join(tmpDir, 'does-not-exist.json')),
    /Unable to read bearer tokens file/
  );
});

test('loadBearerTokens throws on invalid JSON', () => {
  assert.throws(() => loadBearerTokens(writeFile('not json{')), /not valid JSON/);
});

test('loadBearerTokens throws on empty object (hard startup error)', () => {
  assert.throws(() => loadBearerTokens(writeFile('{}')), /no tokens/);
});

test('loadBearerTokens throws on non-object payload', () => {
  assert.throws(() => loadBearerTokens(writeFile('["tok"]')), /JSON object mapping tokens to principals/);
});

test('loadBearerTokens throws on empty principal value', () => {
  assert.throws(() => loadBearerTokens(writeFile(JSON.stringify({ tok: '' }))), /non-empty/);
});

test('middleware rejects request without Authorization header', () => {
  const middleware = createBearerAuthMiddleware({ tokens: new Map([['tok', 'bot']]) });
  const res = mockRes();
  let proceeded = false;
  middleware({ headers: {} }, res, () => { proceeded = true; });
  assert.equal(res.statusCode, 401);
  assert.equal(proceeded, false);
  assert.deepEqual(res.body, { error: 'unauthorized' });
  assert.equal(res.headers['WWW-Authenticate'], 'Bearer');
});

test('middleware rejects request with unknown token', () => {
  const middleware = createBearerAuthMiddleware({ tokens: new Map([['tok', 'bot']]) });
  const res = mockRes();
  let proceeded = false;
  middleware({ headers: { authorization: 'Bearer wrong' } }, res, () => { proceeded = true; });
  assert.equal(res.statusCode, 401);
  assert.equal(proceeded, false);
});

test('middleware rejects malformed Authorization schemes', () => {
  const middleware = createBearerAuthMiddleware({ tokens: new Map([['tok', 'bot']]) });
  for (const authorization of ['bearer tok', 'Basic tok', 'Bearer', 'tok']) {
    const res = mockRes();
    middleware({ headers: { authorization } }, res, () => { throw new Error('must not proceed'); });
    assert.equal(res.statusCode, 401, authorization);
  }
});

test('middleware accepts valid token and attaches principal', () => {
  const middleware = createBearerAuthMiddleware({ tokens: new Map([['tok', 'team-bot']]) });
  const res = mockRes();
  const req = { headers: { authorization: 'Bearer tok' } };
  let proceeded = false;
  middleware(req, res, () => { proceeded = true; });
  assert.equal(proceeded, true);
  assert.equal(req.principal, 'team-bot');
});

test('middleware requires tokens when not in dev mode', () => {
  assert.throws(() => createBearerAuthMiddleware({}), /Bearer tokens are required/);
});

test('allowUnauthenticated bypasses token checks', () => {
  const middleware = createBearerAuthMiddleware({ allowUnauthenticated: true });
  const res = mockRes();
  let proceeded = false;
  middleware({ headers: {} }, res, () => { proceeded = true; });
  assert.equal(proceeded, true);
});
