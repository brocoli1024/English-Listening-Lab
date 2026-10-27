const {test} = require('node:test');
const a = require('node:assert/strict');
const {verifyBytes, safeEntry, resolveTools} = require('../tools.cjs');
test('reject checksum mismatch and unsafe archive entries', () => {
  a.throws(()=>verifyBytes(Buffer.from('wrong'),'0'.repeat(64)));
  for(const name of ['../bad.exe','C:/bad.exe','foo/../../bad','foo\\bad.exe','/bad']) a.throws(()=>safeEntry(name));
  a.equal(safeEntry('bin/ffmpeg.exe'),'bin/ffmpeg.exe');
});
test('resolve absolute tools in Unicode and space paths and report missing executable', () => {
  a.match(resolveTools('C:\\中文 folder',false).ytDlp,/中文 folder/);
  a.throws(()=>resolveTools('C:\\missing-tools'),/yt-dlp/);
});

test('resolves bundled Node and rejects a leftover Deno executable',()=>{
  const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'node-runtime-'));
  try{
    for(const name of ['yt-dlp.exe','ffmpeg.exe','ffprobe.exe','node.exe'])fs.writeFileSync(path.join(root,name),'fixture');
    a.equal(resolveTools(root).node,path.join(root,'node.exe'));
    a.equal(resolveTools(root).deno,undefined);
    fs.writeFileSync(path.join(root,'deno.exe'),'legacy');
    a.throws(()=>resolveTools(root),/Deno/);
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});
