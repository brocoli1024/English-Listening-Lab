const {test} = require('node:test');
const a = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const {createAudioStore} = require('../audio-store.cjs');

test('audio deletion reports storage errors instead of silently succeeding', async t => {
  t.mock.method(fs, 'readdir', async () => { const error = new Error('access denied'); error.code = 'EACCES'; throw error; });
  await a.rejects(createAudioStore('C:/unused-test-audio').remove('import-one'), /access denied/);
});
test('persistent audio survives recreation and validates IDs, bytes and tokens', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(),'studio 中文 '));
  t.after(() => fs.rm(root,{recursive:true,force:true}));
  const source = path.join(root,'download.mp3');
  await fs.writeFile(source,'source');
  const store = createAudioStore(path.join(root,'audio'),async token => {if(token !== 'valid') throw Error('token'); return source;});
  a.equal(await store.save('import-one',{kind:'bytes',name:'song.mp3',bytes:new Uint8Array([1,2,3])}), 'app://studio/audio/import-one');
  a.equal(await createAudioStore(path.join(root,'audio')).resolve('import-one'),'app://studio/audio/import-one');
  await store.save('import-two',{kind:'download',token:'valid'});
  await store.remove('import-two');
  a.equal(await fs.readFile(source,'utf8'),'source');
  await store.resolve('import-one');
  for (const id of ['../escape','C:bad','']) await a.rejects(store.save(id,{kind:'bytes',name:'a.mp3',bytes:new Uint8Array([1])}));
  for (const bytes of [new Uint8Array(),new Uint8Array(50*1024*1024+1)]) await a.rejects(store.save('bad',{kind:'bytes',name:'a.mp3',bytes}));
  await a.rejects(store.save('bad',{kind:'download',token:'foreign'}));
});
