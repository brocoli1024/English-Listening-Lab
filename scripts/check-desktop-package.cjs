const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {createHash} = require('node:crypto');
const {verifyBytes,resolveTools}=require('../desktop/tools.cjs');
const {writeAttachmentManifest}=require('./third-party-attachment-manifest.cjs');
function checkPackage(root=path.resolve('release/win-unpacked')) {
  const resources=path.join(root,'resources'), tools=path.join(resources,'tools');
  function rejectDeno(directory) {
    for(const entry of fs.readdirSync(directory,{withFileTypes:true})) {
      if(entry.isDirectory())rejectDeno(path.join(directory,entry.name));
      else if(/^deno\.exe$/i.test(entry.name))throw new Error('Unexpected Deno executable in Node runtime package');
    }
  }
  rejectDeno(root);
  resolveTools(tools);
  const hashes=JSON.parse(fs.readFileSync(path.join(tools,'installed-hashes.json')));
  for(const [file,hash] of Object.entries(hashes)) verifyBytes(fs.readFileSync(path.join(tools,file)),hash);
  for(const file of ['licenses/NOTICE.txt','tools.lock.json']) if(!fs.statSync(path.join(tools,file)).isFile()) throw new Error(`Missing ${file}`);
  function verifyResource(source, target) {
    if (fs.statSync(source).isDirectory()) {
      for (const entry of fs.readdirSync(source)) verifyResource(path.join(source,entry),path.join(target,entry));
    } else if (!fs.readFileSync(source).equals(fs.readFileSync(target))) {
      throw new Error(`License/resource content mismatch: ${source}`);
    }
  }
  verifyResource(path.resolve('LICENSE'),path.join(resources,'APP-LICENSE.txt'));
  verifyResource(path.resolve('MICROSOFT_RUNTIME_TERMS.txt'),path.join(resources,'MICROSOFT_RUNTIME_TERMS.txt'));
  verifyResource(path.resolve('THIRD_PARTY_NOTICES.md'),path.join(resources,'THIRD_PARTY_NOTICES.md'));
  verifyResource(path.resolve('docs/release/licenses'),path.join(resources,'licenses'));
  verifyResource(path.resolve('desktop/vendor/licenses'),path.join(tools,'licenses'));
  verifyResource(path.resolve('desktop/tools.lock.json'),path.join(tools,'tools.lock.json'));
  verifyResource(path.resolve('desktop/vendor/installed-hashes.json'),path.join(tools,'installed-hashes.json'));
  const asar=require('@electron/asar');
  const archive=path.join(resources,'app.asar');
  const files=asar.listPackage(archive).map(file=>file.replaceAll('\\','/'));
  if(files.some(file=>/(?:^|\/)deno\.exe$/i.test(file)))throw new Error('Unexpected Deno executable in app.asar');
  for(const required of ['/desktop/main.cjs','/desktop/preload.cjs','/desktop/project-links.cjs','/desktop/project-links.json','/dist/index.html']) if(!files.includes(required)) throw new Error(`Missing ${required}`);
  if(!asar.extractFile(archive,'desktop/project-links.json').equals(fs.readFileSync('desktop/project-links.json'))) throw new Error('Project links differ from the packaged configuration');
  if(files.some(file=>/\/(?:\.git|\.test-data|\.downloads|artifacts|vendor|tests)\//.test(file))) throw new Error('Unexpected private/test files in package');
  const metadata=JSON.parse(asar.extractFile(archive,'package.json'));
  if(metadata.main!=='desktop/main.cjs' || metadata.version!==require('../package.json').version) throw new Error('Wrong desktop entry/version');
  console.log(`Package verified: ${metadata.version}`);
}
if(require.main===module) {
  checkPackage();
  for(const filename of fs.readdirSync('release').filter(name=>name.endsWith('.exe'))) {
    const hash=createHash('sha256').update(fs.readFileSync(path.join('release',filename))).digest('hex');
    fs.writeFileSync(path.join('release',`${filename}.sha256`),`${hash}  ${filename}\n`);
  }
  const sources=path.resolve('desktop/vendor/sources');
  if(fs.existsSync(sources)) execFileSync('tar',['-czf',path.resolve('release/third-party-sources.tar.gz'),'-C',sources,'.'],{windowsHide:true});
  const manifest=writeAttachmentManifest({root:path.resolve('.')});
  console.log(`Private review source manifest verified: ${manifest.sourceArchive.contents.length} source archives.`);
}
module.exports={checkPackage};
