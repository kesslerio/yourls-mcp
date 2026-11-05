import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getToolRegistrations, filterToolRegistrations } from '../src/index.js';
import { parseAllowedTools } from '../src/config.js';

// Registrations only hold the client in closures; a stub is enough here
const stubClient = {};

test('getToolRegistrations returns the full default tool set', () => {
  const registrations = getToolRegistrations(stubClient);
  assert.equal(registrations.length, 14);
  const names = registrations.map(r => r.name);
  for (const expected of [
    'shorten_url', 'expand_url', 'url_stats', 'db_stats', 'url_analytics',
    'contract_url', 'update_url', 'change_keyword', 'get_url_keyword',
    'delete_url', 'list_urls', 'generate_qr_code', 'create_custom_url',
    'shorten_with_analytics'
  ]) {
    assert.ok(names.includes(expected), `missing tool ${expected}`);
  }
});

test('filterToolRegistrations returns all registrations when allowlist is unset', () => {
  const registrations = getToolRegistrations(stubClient);
  assert.equal(filterToolRegistrations(registrations, null).length, 14);
  assert.equal(filterToolRegistrations(registrations, undefined).length, 14);
});

test('filterToolRegistrations keeps only allowlisted tools', () => {
  const registrations = getToolRegistrations(stubClient);
  const filtered = filterToolRegistrations(registrations, ['shorten_url', 'expand_url', 'url_stats']);
  assert.deepEqual(filtered.map(r => r.name).sort(), ['expand_url', 'shorten_url', 'url_stats']);
});

test('filterToolRegistrations drops unknown tool names', () => {
  const registrations = getToolRegistrations(stubClient);
  const filtered = filterToolRegistrations(registrations, ['shorten_url', 'no_such_tool']);
  assert.deepEqual(filtered.map(r => r.name), ['shorten_url']);
});

test('parseAllowedTools parses a comma-separated list', () => {
  assert.deepEqual(
    parseAllowedTools('shorten_url, expand_url ,url_stats'),
    ['shorten_url', 'expand_url', 'url_stats']
  );
});

test('parseAllowedTools treats unset/blank as no allowlist', () => {
  assert.equal(parseAllowedTools(undefined), null);
  assert.equal(parseAllowedTools(null), null);
  assert.equal(parseAllowedTools(''), null);
  assert.equal(parseAllowedTools('   '), null);
  assert.equal(parseAllowedTools(',,,'), null);
});
