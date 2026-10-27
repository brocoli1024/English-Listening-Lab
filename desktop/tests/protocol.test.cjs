const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { resolveAppPath, parseByteRange, serveFile } = require('../protocol.cjs');
test('static paths stay inside the app origin and root', () => {
  assert.equal(resolveAppPath('app://studio/', 'dist'), path.resolve('dist/index.html'));
  for (const url of ['app://evil/a', 'https://studio/a', 'app://studio/%2e%2e/secret', 'app://studio/%252e%252e/secret', 'app://studio/a%5cb', 'app://studio/C:/secret']) assert.throws(() => resolveAppPath(url, 'dist'));
});
test('ranges include closed, open and suffix forms and reject invalid requests', () => {
  assert.deepEqual(parseByteRange('bytes=0-9', 100), {start:0,end:9});
  assert.deepEqual(parseByteRange('bytes=-10', 100), {start:90,end:99});
  assert.deepEqual(parseByteRange('bytes=95-', 100), {start:95,end:99});
  assert.equal(parseByteRange(null, 100), null);
  for (const range of ['bytes=100-', 'bytes=9-1', 'bytes=-0', 'bytes=0-1,3-4']) assert.throws(() => parseByteRange(range, 100));
});
test('HEAD has no body and invalid range produces 416', async () => {
  const response = await serveFile(__filename, new Request('app://studio/a', {method:'HEAD'}));
  assert.equal(response.status, 200);
  assert.equal(await response.text(), '');
  const invalid = await serveFile(__filename, new Request('app://studio/a', {headers:{Range:'bytes=999999-'}}));
  assert.equal(invalid.status, 416);
});
