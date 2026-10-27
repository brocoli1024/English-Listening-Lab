const test = require('node:test');
const assert = require('node:assert/strict');
const {openProjectPage} = require('../project-links.cjs');

test('opens only fixed project pages and rejects arbitrary URLs, schemes and object keys', async () => {
  const opened = [];
  for (const key of ['downloads', 'issues', 'privacy']) await openProjectPage(key, async url => opened.push(url));
  assert.equal(opened.length, 3);
  for (const url of opened) assert.ok(url.startsWith('https://github.com/brocoli1024/English-Listening-Lab/'));
  for (const key of ['https://evil.invalid/', 'file:///C:/Windows', 'javascript:alert(1)', '__proto__', 'constructor', '', null, {}]) {
    await assert.rejects(openProjectPage(key, async url => opened.push(url)), /專案頁面/);
  }
  assert.equal(opened.length, 3);
});

test('reports browser launch failure instead of claiming success', async () => {
  await assert.rejects(openProjectPage('downloads', async () => { throw new Error('browser unavailable'); }), /無法開啟瀏覽器/);
});
