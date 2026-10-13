import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { SERVER_VERSION } from '../dist/version.js';

const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('the server reports the version of its package, not a fixed string', () => {
  assert.equal(SERVER_VERSION, manifest.version);
});

test('neither server hard-codes a version any more', () => {
  for (const file of ['mcp-server.js', 'http-mcp-server.js']) {
    const source = readFileSync(new URL(`../dist/${file}`, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /version:\s*'\d+\.\d+\.\d+'/, file);
  }
});
