import { test } from 'node:test';
import assert from 'node:assert/strict';
import createShortenUrlTool from '../src/tools/shortenUrl.js';
import { getToolRegistrations } from '../src/index.js';

const parseBody = (res) => JSON.parse(res.content[0].text);

function mockClient(overrides = {}) {
  const calls = { expand: [], shorten: [] };
  return {
    calls,
    expand: async (shorturl) => {
      calls.expand.push(shorturl);
      if (overrides.expand) {
        return overrides.expand(shorturl);
      }
      const error = new Error('short URL not found');
      error.response = { status: 404 };
      throw error;
    },
    shorten: async (url, keyword, title) => {
      calls.shorten.push({ url, keyword, title });
      if (overrides.shorten) {
        return overrides.shorten(url, keyword, title);
      }
      return { status: 'success', shorturl: `https://s.example/${keyword || 'rand'}`, url, title };
    }
  };
}

test('shorten_url rejects non-kebab-case keywords with invalid_keyword before any API call', async () => {
  const client = mockClient();
  const tool = createShortenUrlTool(client);

  for (const keyword of ['Jane Doe', 'JaneDoe', 'jane_doe', 'JANE', '-lead', 'trail-', 'double--dash', 'has.dot', 'has/slash']) {
    const res = await tool.execute({ url: 'https://example.com', keyword });
    const body = parseBody(res);
    assert.equal(res.isError, true, keyword);
    assert.equal(body.status, 'error', keyword);
    assert.equal(body.code, 'invalid_keyword', keyword);
  }

  assert.equal(client.calls.expand.length, 0);
  assert.equal(client.calls.shorten.length, 0);
});

test('shorten_url returns keyword_exists and never calls shorten when keyword resolves', async () => {
  const client = mockClient({
    expand: async (shorturl) => ({
      shorturl: `https://s.example/${shorturl}`,
      longurl: 'https://existing.example/page',
      title: 'Existing'
    })
  });
  const tool = createShortenUrlTool(client);

  const res = await tool.execute({ url: 'https://new.example/other', keyword: 'acme-corp' });
  const body = parseBody(res);

  assert.equal(res.isError, true);
  assert.equal(body.code, 'keyword_exists');
  assert.equal(body.longurl, 'https://existing.example/page');
  assert.deepEqual(client.calls.expand, ['acme-corp']);
  assert.equal(client.calls.shorten.length, 0);
});

test('shorten_url creates the short URL when the keyword is free', async () => {
  const client = mockClient();
  const tool = createShortenUrlTool(client);

  const res = await tool.execute({ url: 'https://example.com/landing', keyword: 'acme-corp-monthly', title: 'Landing' });
  const body = parseBody(res);

  assert.equal(res.isError, undefined);
  assert.equal(body.status, 'success');
  assert.equal(body.shorturl, 'https://s.example/acme-corp-monthly');
  assert.deepEqual(client.calls.expand, ['acme-corp-monthly']);
  assert.equal(client.calls.shorten.length, 1);
});

test('shorten_url without keyword skips the expansion check', async () => {
  const client = mockClient();
  const tool = createShortenUrlTool(client);

  const res = await tool.execute({ url: 'https://example.com' });
  assert.equal(parseBody(res).status, 'success');
  assert.equal(client.calls.expand.length, 0);
  assert.equal(client.calls.shorten.length, 1);
});

test('shorten_url proceeds when expand returns a not-found body', async () => {
  const client = mockClient({
    expand: async () => ({ errorCode: '404', message: 'Error: short URL not found' })
  });
  const tool = createShortenUrlTool(client);

  const res = await tool.execute({ url: 'https://example.com', keyword: 'acme-demo' });
  assert.equal(parseBody(res).status, 'success');
  assert.equal(client.calls.shorten.length, 1);
});

test('shorten_url description documents the slug policy', async () => {
  const registration = getToolRegistrations(mockClient()).find(r => r.name === 'shorten_url');
  assert.match(registration.description, /business-name slugs?.*kebab-case/i);
  assert.match(registration.description, /never use a person's name/i);
  assert.match(registration.description, /-monthly/);
  assert.match(registration.description, /-annual/);
  assert.match(registration.description, /-demo/);
});
