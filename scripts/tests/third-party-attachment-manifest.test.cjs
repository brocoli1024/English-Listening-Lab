const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {createHash} = require('node:crypto');
const {writeAttachmentManifest} = require('../third-party-attachment-manifest.cjs');

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'third-party-manifest-'));
  const sourcesDir = path.join(root, 'desktop/vendor/sources');
  const releaseDir = path.join(root, 'release');
  fs.mkdirSync(sourcesDir, {recursive: true});
  fs.mkdirSync(releaseDir, {recursive: true});

  const sources = [
    ['yt-dlp.tar.gz', 'yt-dlp source'],
    ['deno.tar.gz', 'deno source'],
    ['ffmpeg.tar.gz', 'ffmpeg source'],
    ['ffmpeg-build.tar.gz', 'ffmpeg build source'],
  ];
  const sourceBytes = Object.fromEntries(sources.map(([name, content]) => {
    const bytes = Buffer.from(content);
    fs.writeFileSync(path.join(sourcesDir, name), bytes);
    return [name, bytes];
  }));
  const tools = [
    {name: 'yt-dlp', version: '2026.08.19', sourceUrl: 'https://example.test/yt-dlp.tar.gz', sourceSha256: sha256(sourceBytes['yt-dlp.tar.gz'])},
    {name: 'deno', version: '2.9.7', sourceUrl: 'https://example.test/deno.tar.gz', sourceSha256: sha256(sourceBytes['deno.tar.gz'])},
    {name: 'ffmpeg', version: 'n8.1.3', sourceUrl: 'https://example.test/ffmpeg.tar.gz', sourceSha256: sha256(sourceBytes['ffmpeg.tar.gz']), buildSourceUrl: 'https://example.test/ffmpeg-build.tar.gz', buildSourceSha256: sha256(sourceBytes['ffmpeg-build.tar.gz'])},
  ];
  fs.mkdirSync(path.join(root, 'desktop'), {recursive: true});
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({version: '1.0.1'}));
  fs.writeFileSync(path.join(root, 'desktop/tools.lock.json'), JSON.stringify({tools}));
  fs.writeFileSync(path.join(root, 'THIRD_PARTY_NOTICES.md'), 'notices');
  fs.writeFileSync(path.join(root, 'MICROSOFT_RUNTIME_TERMS.txt'), 'scoped terms');
  fs.mkdirSync(path.join(root, 'desktop/vendor/licenses'), {recursive: true});
  fs.writeFileSync(path.join(root, 'desktop/vendor/licenses/NOTICE.txt'), 'tool notices');
  fs.mkdirSync(path.join(root, 'docs/release/licenses'), {recursive: true});
  fs.writeFileSync(path.join(root, 'docs/release/licenses/example.txt'), 'license');
  const evidence = [
    'yt-dlp-native-audit.md',
    'yt-dlp-integration-2026-10-23.md',
    'python-runtime-materials.md',
    'curl-native-materials.md',
    'third-party-closure-status.md',
    'priority-notice-review-2026-10-20.md',
    'deno-binary-inclusion-2026-10-20.md',
    'deno-v8-rust-runtime-reachability.json',
    'ffmpeg-nested-review.md',
    'ffmpeg-librsvg-license-gaps.json',
    'rav1e-cc-update-evidence.json',
    'collected-source-index.json',
  ];
  for (const name of evidence) {
    fs.writeFileSync(path.join(root, 'docs/release', name), name === 'collected-source-index.json'
      ? JSON.stringify({archiveCount: 4, totalBytes: 40, problems: [], completeCorrespondingSource: false})
      : 'evidence');
  }

  const installerName = 'English-Listening-Lab-1.0.1-Setup.exe';
  const installerBytes = Buffer.from('installer');
  fs.writeFileSync(path.join(releaseDir, installerName), installerBytes);
  fs.writeFileSync(path.join(releaseDir, `${installerName}.sha256`), `${sha256(installerBytes)}  ${installerName}\n`);
  execFileSync('tar', ['-czf', path.join(releaseDir, 'third-party-sources.tar.gz'), '-C', sourcesDir, '.']);
  return {root, sourceBytes};
}

test('writes a private review manifest with hashes for the installer and every locked source', () => {
  const {root, sourceBytes} = fixture();
  try {
    const manifest = writeAttachmentManifest({root, generatedAt: '2026-10-22T00:00:00.000Z'});
    assert.equal(manifest.packageVersion, '1.0.1');
    assert.equal(manifest.publicDistributionApproved, false);
    assert.equal(manifest.sourceClosureComplete, false);
    assert.equal(manifest.sourceArchive.sha256, sha256(fs.readFileSync(path.join(root, 'release/third-party-sources.tar.gz'))));
    assert.deepEqual(manifest.sourceArchive.contents.map(item => item.filename), [
      'deno.tar.gz', 'ffmpeg-build.tar.gz', 'ffmpeg.tar.gz', 'yt-dlp.tar.gz',
    ]);
    assert.deepEqual(manifest.sourceArchive.contents.map(item => item.sha256), [
      sha256(sourceBytes['deno.tar.gz']),
      sha256(sourceBytes['ffmpeg-build.tar.gz']),
      sha256(sourceBytes['ffmpeg.tar.gz']),
      sha256(sourceBytes['yt-dlp.tar.gz']),
    ]);
    assert.equal(manifest.installers[0].sha256, sha256(Buffer.from('installer')));
    assert.equal(manifest.components.find(item => item.name === 'deno').status, 'incomplete');
    assert.ok(manifest.notices.some(item => item.packagedPath === 'resources/THIRD_PARTY_NOTICES.md'));
    assert.ok(fs.existsSync(path.join(root, 'release/third-party-source-manifest.json')));
  } finally {
    fs.rmSync(root, {recursive: true, force: true});
  }
});

test('refuses to write a manifest when a locked source digest does not match', () => {
  const {root} = fixture();
  try {
    fs.writeFileSync(path.join(root, 'desktop/vendor/sources/deno.tar.gz'), 'changed source');
    assert.throws(() => writeAttachmentManifest({root}), /SHA-256 mismatch.*deno\.tar\.gz/);
    assert.equal(fs.existsSync(path.join(root, 'release/third-party-source-manifest.json')), false);
  } finally {
    fs.rmSync(root, {recursive: true, force: true});
  }
});

test('Node replacement manifests contain Node sources and no active Deno component',()=>{
  const {root}=fixture();
  try{
    const toolFile=path.join(root,'desktop/tools.lock.json');const lock=JSON.parse(fs.readFileSync(toolFile));
    const runtime=lock.tools.find(x=>x.name==='deno');runtime.name='node';runtime.version='24.22.1';runtime.sourceUrl='https://example.test/node.tar.xz';runtime.sourceSha256=sha256('Node source');
    fs.writeFileSync(toolFile,JSON.stringify(lock));
    fs.unlinkSync(path.join(root,'desktop/vendor/sources/deno.tar.gz'));
    fs.writeFileSync(path.join(root,'desktop/vendor/sources/node.tar.xz'),'Node source');
    fs.writeFileSync(path.join(root,'docs/release/node-runtime-option-2026-10-22.md'),'runtime evidence');
    execFileSync('tar',['-czf',path.join(root,'release/third-party-sources.tar.gz'),'-C',path.join(root,'desktop/vendor/sources'),'.']);
    const manifest=writeAttachmentManifest({root});
    assert.ok(manifest.components.some(x=>x.name==='node'));
    assert.ok(!manifest.components.some(x=>x.name==='deno'));
    assert.ok(manifest.sourceArchive.contents.some(x=>x.filename==='node.tar.xz'));
    assert.ok(!manifest.sourceArchive.contents.some(x=>x.filename==='deno.tar.gz'));
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('source-built FFmpeg uses its validated build receipt instead of the legacy BtbN source set',()=>{
  const {root}=fixture();
  try{
    const {buildKey}=require('../ffmpeg-build.cjs');
    const inputs=['desktop/ffmpeg-build.lock.json','docs/release/lame-svn-source.json','scripts/build-ffmpeg.py','scripts/build-ffmpeg.sh','scripts/ffmpeg-build.cjs'];
    for(const name of inputs){fs.mkdirSync(path.dirname(path.join(root,name)),{recursive:true});fs.writeFileSync(path.join(root,name),name);}
    const toolFile=path.join(root,'desktop/tools.lock.json');
    const lock=JSON.parse(fs.readFileSync(toolFile));const ff=lock.tools.find(t=>t.name==='ffmpeg');ff.format='source-build';delete ff.buildSourceSha256;delete ff.buildSourceUrl;
    fs.writeFileSync(toolFile,JSON.stringify(lock));
    const sources={};
    for(const name of ['ffmpeg.tar.gz','lame.tar.gz','ffmpeg-build.tar.gz']){
      const file=path.join(root,'desktop/vendor/sources',name);
      if(!fs.existsSync(file))fs.writeFileSync(file,name);
      sources[name]={path:'output/sources/'+name,sha256:sha256(fs.readFileSync(file))};
    }
    fs.writeFileSync(path.join(root,'desktop/vendor/ffmpeg-build-receipt.json'),JSON.stringify({buildKey:buildKey(inputs.map(name=>fs.readFileSync(path.join(root,name)))),sources}));
    fs.writeFileSync(path.join(root,'docs/release/ffmpeg-source-build.md'),'build evidence');
    fs.writeFileSync(path.join(root,'docs/release/ffmpeg-runtime-source-evidence.json'),'runtime evidence');
    execFileSync('tar',['-czf',path.join(root,'release/third-party-sources.tar.gz'),'-C',path.join(root,'desktop/vendor/sources'),'.']);
    const manifest=writeAttachmentManifest({root});
    assert.deepEqual(manifest.components.find(x=>x.name==='ffmpeg').sourceArchives,['ffmpeg-build.tar.gz','ffmpeg.tar.gz','lame.tar.gz']);
    assert.ok(!manifest.components.find(x=>x.name==='ffmpeg').evidence.some(x=>x.includes('rav1e')));
    assert.equal(manifest.components.find(x=>x.name==='ffmpeg').status,'closed-for-pinned-local-build');
    fs.writeFileSync(path.join(root,'scripts/build-ffmpeg.sh'),'changed recipe');
    assert.throws(()=>writeAttachmentManifest({root}),/build key/i);
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('refuses a source bundle whose member bytes differ from the locked archives', () => {
  const {root, sourceBytes} = fixture();
  const staleDir = path.join(root, 'stale-sources');
  fs.mkdirSync(staleDir);
  try {
    for (const [name, bytes] of Object.entries(sourceBytes)) {
      fs.writeFileSync(path.join(staleDir, name), name === 'deno.tar.gz' ? Buffer.from('stale deno source') : bytes);
    }
    execFileSync('tar', ['-czf', path.join(root, 'release/third-party-sources.tar.gz'), '-C', staleDir, '.']);
    assert.throws(() => writeAttachmentManifest({root}), /Source archive member SHA-256 mismatch.*deno\.tar\.gz/);
    assert.equal(fs.existsSync(path.join(root, 'release/third-party-source-manifest.json')), false);
  } finally {
    fs.rmSync(root, {recursive: true, force: true});
  }
});

test('includes pinned yt-dlp dependency material inputs and rejects altered source bytes',()=>{const{root}=fixture();try{const bytes=Buffer.from('dependency source'),filename='ytdlp-dependency.tar.gz';fs.writeFileSync(path.join(root,'desktop/yt-dlp-materials.lock.json'),JSON.stringify({inputs:[{name:'dep',filename,url:'https://example.test/dep',sha256:sha256(bytes),kind:'source-or-distribution-input'}]}));fs.writeFileSync(path.join(root,'desktop/vendor/sources',filename),bytes);execFileSync('tar',['-czf',path.join(root,'release/third-party-sources.tar.gz'),'-C',path.join(root,'desktop/vendor/sources'),'.']);let manifest=writeAttachmentManifest({root});assert.ok(manifest.components.find(x=>x.name==='yt-dlp').sourceArchives.includes(filename));assert.equal(manifest.sourceArchive.contents.find(x=>x.filename===filename).evidence,'desktop/yt-dlp-materials.lock.json');fs.writeFileSync(path.join(root,'desktop/vendor/sources',filename),'corrupted');assert.throws(()=>writeAttachmentManifest({root}),/SHA-256/);}finally{fs.rmSync(root,{recursive:true,force:true})}});
