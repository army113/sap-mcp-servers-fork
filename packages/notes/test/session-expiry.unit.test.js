import assert from 'node:assert/strict';
import test from 'node:test';
import { SapNotesApiClient } from '../dist/sap-notes-api.js';

// A persistent browser whose page shows the SAP sign-in page instead of the note.
function clientOnSignInPage() {
  const client = new SapNotesApiClient({ ssoStorageStateFile: '/never/written/sso-storage-state.json' });
  const calls = { storageState: 0, browserClosed: 0 };
  const page = {
    goto: async () => ({ ok: () => true, status: () => 200 }),
    waitForTimeout: async () => {},
    content: async () => '<html><title>Sign In</title><form id="logOnForm"></form></html>',
    title: async () => 'Sign In',
    url: () => 'https://accounts.sap.com/saml2/idp/sso',
    close: async () => {}
  };
  client.ensurePersistentBrowser = async function () {
    this.browser = { close: async () => { calls.browserClosed++; } };
    this.browserContext = {
      newPage: async () => page,
      storageState: async () => { calls.storageState++; }
    };
  };
  client.isAuthenticationResponse = () => true;
  return { client, calls };
}

test('an expired session does not overwrite the shared SSO state with a logged-out one', async () => {
  const { client, calls } = clientOnSignInPage();
  await assert.rejects(client.getNoteWithPlaywright('3096734', 'token'), /SESSION_EXPIRED/);
  assert.equal(calls.storageState, 0, 'the logged-out browser state was saved over the shared SSO file');
});

test('an expired session closes the persistent browser, so the next call logs on again', async () => {
  const { client, calls } = clientOnSignInPage();
  await assert.rejects(client.getNoteWithPlaywright('3096734', 'token'));
  assert.equal(calls.browserClosed, 1);
  assert.equal(client.browser, null);
  assert.equal(client.browserContext, null);
});
