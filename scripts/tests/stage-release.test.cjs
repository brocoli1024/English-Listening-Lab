const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {createHash} = require('node:crypto');
const {stageRelease, verifyBundle} = require('../stage-release.cjs');
const hash = data => createHash('sha256').update(data).digest('hex');

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'release-staging-'));
  t.after(() => fs.rmSync(root, {recursive: true, force: true}));
  fs.mkdirSync(path.join(root, 'release'));
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({version: '1.0.3'}));
  const name = 'English-Listening-Lab-1.0.3-Setup.exe';
  const installer = Buffer.from('installer');
  const sources = Buffer.from('source archive');
  const manifest = {
    packageVersion: '1.0.3', publicDistributionApproved: false, sourceClosureComplete: false,
    installers: [{filename: name, version: '1.0.3', bytes: installer.length, sha256: hash(installer)}],
    sourceArchive: {filename: 'third-party-sources.tar.gz', bytes: sources.length, sha256: hash(sources)},
  };
  const writeManifest = () => fs.writeFileSync(path.join(root, 'release/third-party-source-manifest.json'), JSON.stringify(manifest));
  fs.writeFileSync(path.join(root, 'release', name), installer);
  fs.writeFileSync(path.join(root, 'release', `${name}.sha256`), `${hash(installer)}  ${name}\n`);
  fs.writeFileSync(path.join(root, 'release/third-party-sources.tar.gz'), sources);
  writeManifest();
  return {root, name, manifest, writeManifest};
}

test('stages only four current-version assets despite old installers and private files', t => {
  const {root, name} = fixture(t);
  fs.writeFileSync(path.join(root, 'release/English-Listening-Lab-1.0.2-Setup.exe'), 'old');
  fs.writeFileSync(path.join(root, 'release/personal-song.mp3'), 'private');
  const result = stageRelease(root);
  assert.deepEqual(fs.readdirSync(result.directory).sort(), [name, `${name}.sha256`, 'third-party-source-manifest.json', 'third-party-sources.tar.gz'].sort());
  assert.equal(verifyBundle(result.directory, '1.0.3').publicDistributionApproved, false);
  assert.equal(stageRelease(root).directory, result.directory);
});

test('rejects a wrong-version manifest rather than packaging an older installer', t => {
  const f = fixture(t);
  f.manifest.packageVersion = '1.0.2'; f.writeManifest();
  assert.throws(() => stageRelease(f.root), /version/i);
});

test('rejects tampered installer, source bundle and checksum sidecar', t => {
  for (const filename of ['English-Listening-Lab-1.0.3-Setup.exe', 'third-party-sources.tar.gz', 'English-Listening-Lab-1.0.3-Setup.exe.sha256']) {
    const {root} = fixture(t);
    fs.appendFileSync(path.join(root, 'release', filename), 'tampered');
    assert.throws(() => stageRelease(root), /hash|checksum|size/i);
  }
});

test('refuses unexpected files in a prepared bundle without deleting them', t => {
  const {root} = fixture(t);
  const {directory} = stageRelease(root);
  const extra = path.join(directory, 'backup.json');
  fs.writeFileSync(extra, 'private');
  assert.throws(() => verifyBundle(directory, '1.0.3'), /unexpected|contents/i);
  assert.throws(() => stageRelease(root), /unexpected|contents/i);
  assert.equal(fs.readFileSync(extra, 'utf8'), 'private');
});

test('rejects an asset replaced by a directory junction or symbolic link', t => {
  const {root, name} = fixture(t);
  const {directory} = stageRelease(root);
  const asset = path.join(directory, name);
  fs.unlinkSync(asset);
  fs.symlinkSync(path.join(root, 'release'), asset, 'junction');
  assert.throws(() => verifyBundle(directory, '1.0.3'), /regular release asset/i);
});

test('does not overwrite a previously prepared bundle with a different manifest', t => {
  const f = fixture(t);
  const {directory} = stageRelease(f.root);
  f.manifest.generatedAt = 'different'; f.writeManifest();
  assert.throws(() => stageRelease(f.root), /different|differs/i);
  assert.equal(JSON.parse(fs.readFileSync(path.join(directory, 'third-party-source-manifest.json'))).generatedAt, undefined);
});
