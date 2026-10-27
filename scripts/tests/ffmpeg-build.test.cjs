const test=require('node:test');
const a=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {createHash}=require('node:crypto');
const {validateBuildReceipt,buildKey}=require('../ffmpeg-build.cjs');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
function fixture(){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'ffmpeg-receipt-'));
  const files={};
  for(const name of ['ffmpeg.exe','ffprobe.exe','libmp3lame-0.dll','libwinpthread-1.dll','ffmpeg.tar.gz','lame.tar.gz','ffmpeg-build.tar.gz','ffmpeg-tools.zip']){
    fs.writeFileSync(path.join(root,name),name); files[name]={path:name,sha256:hash(name)};
  }
  const receipt={buildKey:'a'.repeat(64),archive:files['ffmpeg-tools.zip'],binaries:Object.fromEntries(Object.entries(files).filter(([name])=>/\.(exe|dll)$/.test(name))),sources:Object.fromEntries(Object.entries(files).filter(([name])=>name.endsWith('.tar.gz')))};
  return {root,receipt};
}
test('accepts complete receipts and rejects changed or missing runtime DLLs',()=>{
  const {root,receipt}=fixture();
  try{
    a.equal(validateBuildReceipt(root,receipt,'a'.repeat(64)),receipt);
    fs.writeFileSync(path.join(root,'libwinpthread-1.dll'),'changed');
    a.throws(()=>validateBuildReceipt(root,receipt,'a'.repeat(64)),/SHA-256/);
    fs.unlinkSync(path.join(root,'libwinpthread-1.dll'));
    a.throws(()=>validateBuildReceipt(root,receipt,'a'.repeat(64)),/missing/i);
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('rejects stale recipes, omitted DLL declarations, and escaping paths',()=>{
  const {root,receipt}=fixture();
  try{
    a.throws(()=>validateBuildReceipt(root,receipt,'b'.repeat(64)),/build key/i);
    delete receipt.binaries['libmp3lame-0.dll'];
    a.throws(()=>validateBuildReceipt(root,receipt,'a'.repeat(64)),/binary set/i);
    receipt.binaries['libmp3lame-0.dll']={path:'../outside',sha256:'a'.repeat(64)};
    a.throws(()=>validateBuildReceipt(root,receipt,'a'.repeat(64)),/path/i);
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('build key changes when a recipe or locked input changes',()=>{
  a.notEqual(buildKey([Buffer.from('lock'),Buffer.from('recipe')]),buildKey([Buffer.from('lock2'),Buffer.from('recipe')]));
  a.notEqual(buildKey([Buffer.from('lock'),Buffer.from('recipe')]),buildKey([Buffer.from('lock'),Buffer.from('recipe2')]));
});
