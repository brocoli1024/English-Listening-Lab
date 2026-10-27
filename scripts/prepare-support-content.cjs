const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const content = {
  version: JSON.parse(read('package.json')).version,
  appLicense: read('LICENSE'),
  thirdPartyNotices: read('THIRD_PARTY_NOTICES.md'),
  microsoftRuntimeTerms: read('MICROSOFT_RUNTIME_TERMS.txt').replace(/^\uFEFF/, ''),
};
fs.mkdirSync(path.join(root, 'src/generated'), {recursive: true});
fs.writeFileSync(path.join(root, 'src/generated/support-content.json'), JSON.stringify(content, null, 2) + '\n');
