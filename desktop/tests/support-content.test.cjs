const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {execFileSync} = require('node:child_process');

test('support content is generated from the current version and original notices', () => {
  execFileSync(process.execPath, ['scripts/prepare-support-content.cjs']);
  const value = JSON.parse(fs.readFileSync('src/generated/support-content.json', 'utf8'));
  assert.equal(value.version, JSON.parse(fs.readFileSync('package.json')).version);
  assert.equal(value.appLicense, fs.readFileSync('LICENSE', 'utf8'));
  assert.equal(value.thirdPartyNotices, fs.readFileSync('THIRD_PARTY_NOTICES.md', 'utf8'));
});

test('support contains the exact current Microsoft recipient terms',()=>{execFileSync(process.execPath,['scripts/prepare-support-content.cjs']);const value=JSON.parse(fs.readFileSync('src/generated/support-content.json','utf8'));assert.equal(value.microsoftRuntimeTerms,fs.readFileSync('MICROSOFT_RUNTIME_TERMS.txt','utf8').replace(/^\uFEFF/,''));});
