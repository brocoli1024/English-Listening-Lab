const fs=require('node:fs');
const path=require('node:path');
const {createHash}=require('node:crypto');
const {execFileSync}=require('node:child_process');
const BINARIES=['ffmpeg.exe','ffprobe.exe','libmp3lame-0.dll','libwinpthread-1.dll'].sort();
const SOURCES=['ffmpeg.tar.gz','lame.tar.gz','ffmpeg-build.tar.gz'].sort();
const INPUTS=['desktop/ffmpeg-build.lock.json','docs/release/lame-svn-source.json','scripts/build-ffmpeg.py','scripts/build-ffmpeg.sh','scripts/ffmpeg-build.cjs'];
function buildKey(parts){const h=createHash('sha256');for(const part of parts){h.update(String(part.length));h.update(':');h.update(part);}return h.digest('hex');}
function validateBuildReceipt(root,receipt,key){
  if(receipt.buildKey!==key)throw Error('FFmpeg build key mismatch; rebuild required');
  if(JSON.stringify(Object.keys(receipt.binaries||{}).sort())!==JSON.stringify(BINARIES))throw Error('FFmpeg binary set is incomplete');
  if(JSON.stringify(Object.keys(receipt.sources||{}).sort())!==JSON.stringify(SOURCES))throw Error('FFmpeg source set is incomplete');
  for(const item of [receipt.archive,...Object.values(receipt.binaries),...Object.values(receipt.sources)]){
    if(!item || typeof item.path!=='string' || path.isAbsolute(item.path) || item.path.includes('\\') || item.path.split('/').some(p=>p==='..') || !path.resolve(root,item.path).startsWith(path.resolve(root)+path.sep))throw Error('Invalid FFmpeg build receipt path');
    const file=path.resolve(root,item.path);
    if(!fs.existsSync(file))throw Error(`FFmpeg build file missing: ${item.path}`);
    const hash=createHash('sha256').update(fs.readFileSync(file)).digest('hex');
    if(hash!==item.sha256)throw Error(`FFmpeg build SHA-256 mismatch: ${item.path}`);
  }
  return receipt;
}
function buildFFmpeg({root=path.resolve(__dirname,'..')}={}){
  const key=buildKey(INPUTS.map(file=>fs.readFileSync(path.join(root,file))));
  const buildRoot=path.join(root,'desktop/.downloads/ffmpeg-build',key);
  const receiptFile=path.join(buildRoot,'receipt.json');
  if(!fs.existsSync(receiptFile)){
    if(process.platform!=='win32')throw Error('FFmpeg source build requires Windows');
    execFileSync('python',[path.join(root,'scripts/build-ffmpeg.py'),'--root',root,'--build-key',key],{cwd:root,stdio:'inherit',windowsHide:true,timeout:60*60*1000});
  }
  return {directory:buildRoot,...validateBuildReceipt(buildRoot,JSON.parse(fs.readFileSync(receiptFile)),key)};
}
module.exports={buildKey,validateBuildReceipt,buildFFmpeg};
if(require.main===module){try{const result=buildFFmpeg();console.log(`Verified source-built FFmpeg: ${result.directory}`);}catch(e){console.error(e.message);process.exitCode=1;}}
