import assert from 'node:assert/strict';
import test from 'node:test';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { SapNoteMcpServer } from '../dist/mcp-server.js';
import { HttpSapNoteMcpServer } from '../dist/http-mcp-server.js';

// Run fn with the given environment variables set (undefined removes one), then restore them.
function withEnv(vars, fn) {
  const saved = {};
  for (const [name, value] of Object.entries(vars)) {
    saved[name] = process.env[name];
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
  try {
    return fn();
  } finally {
    for (const [name, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
}

test('without HOME (Windows), the shared SSO state lives in the home directory, not the working directory', () => {
  for (const Server of [SapNoteMcpServer, HttpSapNoteMcpServer]) {
    const config = withEnv({ HOME: undefined, SAP_SSO_STORAGE_STATE: undefined }, () =>
      Server.prototype.loadConfig.call({})
    );
    assert.equal(config.ssoStorageStateFile, join(homedir(), '.sap-mcp', 'sso-storage-state.json'), Server.name);
  }
});

test('HOME still takes precedence, and SAP_SSO_STORAGE_STATE over both', () => {
  for (const Server of [SapNoteMcpServer, HttpSapNoteMcpServer]) {
    const home = join(homedir(), 'sap-mcp-test-home');
    let config = withEnv({ HOME: home, SAP_SSO_STORAGE_STATE: undefined }, () =>
      Server.prototype.loadConfig.call({})
    );
    assert.equal(config.ssoStorageStateFile, join(home, '.sap-mcp', 'sso-storage-state.json'), Server.name);

    const explicit = join(homedir(), 'explicit-state.json');
    config = withEnv({ HOME: home, SAP_SSO_STORAGE_STATE: explicit }, () =>
      Server.prototype.loadConfig.call({})
    );
    assert.equal(config.ssoStorageStateFile, explicit, Server.name);
  }
});

test('~ in a configured path expands to the home directory even without HOME', () => {
  for (const Server of [SapNoteMcpServer, HttpSapNoteMcpServer]) {
    const config = withEnv({ HOME: undefined, USERPROFILE: undefined, SAP_SSO_STORAGE_STATE: '~/state.json' }, () =>
      Server.prototype.loadConfig.call({})
    );
    assert.equal(config.ssoStorageStateFile, join(homedir(), 'state.json'), Server.name);
  }
});
