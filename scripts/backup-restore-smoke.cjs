const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');

async function run(profile, mode) {
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['scripts/packaged-desktop-smoke.cjs', 'development', mode, profile], { windowsHide: true, stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', code => code === 0 ? resolve() : reject(new Error(`Smoke exit ${code}`)));
  });
}
async function inventory(root, relative = '') {
  const entries = [];
  for (const item of await fs.readdir(path.join(root, relative), { withFileTypes: true })) {
    const name = path.join(relative, item.name);
    if (item.isDirectory()) entries.push(...await inventory(root, name));
    else if (item.isFile()) entries.push([name, crypto.createHash('sha256').update(await fs.readFile(path.join(root, name))).digest('hex')]);
    else throw new Error(`Unexpected link in isolated profile: ${name}`);
  }
  return entries.sort(([a], [b]) => a.localeCompare(b));
}
async function main() {
  const base = path.resolve('desktop/.test-data');
  await fs.mkdir(base, { recursive: true });
  const root = await fs.mkdtemp(path.join(base, 'backup-restore-'));
  const source = path.join(root, 'original');
  const restored = path.join(root, 'restored');
  await run(source, 'seed');
  // The child app has exited before copying LevelDB and audio together.
  await fs.cp(source, restored, { recursive: true, errorOnExist: true, force: false });
  const before = await inventory(source);
  const copied = await inventory(restored);
  if (JSON.stringify(before) !== JSON.stringify(copied)) throw new Error('Backup byte comparison failed');
  await run(restored, 'restart');
  if (JSON.stringify(before) !== JSON.stringify(await inventory(source))) throw new Error('Restoring changed the original profile');
  const report = { profile: root, copiedFiles: before.length, byteIdenticalBeforeOpening: true, restoredStorageAndAudio: true, restoredLibraryDraftAndResults: true, sourceUnchanged: true, scope: 'Development Electron, closed-profile backup/restore; not upgrade or clean-machine acceptance' };
  await fs.writeFile(path.join(root, 'result.json'), JSON.stringify(report, null, 2));
  console.log('PASS: closed-profile byte-identical backup, restored local storage/audio, original unchanged');
  console.log(root);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
