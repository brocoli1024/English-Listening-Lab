const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');

function assetNames(version) {
  if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('Invalid release version');
  const installer = `English-Listening-Lab-${version}-Setup.exe`;
  return [installer, `${installer}.sha256`, 'third-party-sources.tar.gz', 'third-party-source-manifest.json'];
}
function readRegular(directory, name) {
  const filename = path.join(directory, name);
  const stat = fs.lstatSync(filename);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`Not a regular release asset: ${name}`);
  return fs.readFileSync(filename);
}
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

function verifyAssets(directory, version, exact) {
  const names = assetNames(version);
  if (fs.lstatSync(directory).isSymbolicLink()) throw new Error('Release directory must not be a link');
  if (exact && JSON.stringify(fs.readdirSync(directory).sort()) !== JSON.stringify([...names].sort())) {
    throw new Error('Unexpected bundle contents; only the four approved asset names are allowed');
  }
  const buffers = Object.fromEntries(names.map(name => [name, readRegular(directory, name)]));
  const manifest = JSON.parse(buffers[names[3]].toString('utf8'));
  if (manifest.packageVersion !== version || manifest.installers?.length !== 1 ||
      manifest.installers[0].filename !== names[0] || manifest.installers[0].version !== version ||
      manifest.sourceArchive?.filename !== names[2]) throw new Error('Manifest version or asset list mismatch');
  // Staging is a private review operation. It must never manufacture clearance.
  if (manifest.publicDistributionApproved !== false || manifest.sourceClosureComplete !== false) {
    throw new Error('This review staging tool requires the existing unresolved review flags');
  }
  for (const [name, entry] of [[names[0], manifest.installers[0]], [names[2], manifest.sourceArchive]]) {
    if (buffers[name].length !== entry.bytes || hash(buffers[name]) !== entry.sha256) throw new Error(`Hash or size mismatch: ${name}`);
  }
  if (buffers[names[1]].toString('utf8').trim() !== `${manifest.installers[0].sha256}  ${names[0]}`) {
    throw new Error('Installer checksum mismatch');
  }
  return {names, buffers, manifest};
}
function verifyBundle(directory, version) {
  return verifyAssets(directory, version, true).manifest;
}
function stageRelease(root = path.resolve(__dirname, '..')) {
  const version = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;
  const release = path.join(root, 'release');
  const checked = verifyAssets(release, version, false);
  const directory = path.join(release, `review-${version}`);
  if (fs.existsSync(directory)) {
    verifyBundle(directory, version);
    for (const name of checked.names) {
      if (!readRegular(directory, name).equals(checked.buffers[name])) throw new Error(`Existing bundle differs: ${name}; preserve it and use a new version`);
    }
  } else {
    fs.mkdirSync(directory);
    for (const name of checked.names) fs.writeFileSync(path.join(directory, name), checked.buffers[name], {flag: 'wx'});
    verifyBundle(directory, version);
  }
  return {directory, assets: checked.names, publicDistributionApproved: false};
}
if (require.main === module) {
  try {
    const root = path.resolve(__dirname, '..');
    if (process.argv[2] === '--verify') {
      const version = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;
      verifyBundle(path.resolve(process.argv[3] || ''), version);
      console.log(`Verified four private review assets for ${version}`);
    } else if (process.argv.length === 2) {
      const result = stageRelease(root);
      if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `directory=${result.directory}\n`);
      console.log(JSON.stringify(result, null, 2));
    }
    else throw new Error('Usage: node scripts/stage-release.cjs [--verify DIRECTORY]');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = {stageRelease, verifyBundle};
