const test=require('node:test');
const a=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const os=require('node:os');
const {createHash}=require('node:crypto');
const {prepareTools}=require('../prepare-desktop-tools.cjs');
const zip=Buffer.from('UEsDBBQAAAAIAPJaVl11A2gQDAAAAAoAAAAOAAAAYmluL2ZmbXBlZy5leGVLS8stSE3XS61IBQBQSwMEFAAAAAgA8lpWXRcRFqwNAAAACwAAAA8AAABiaW4vZmZwcm9iZS5leGVLSysoyk9K1UutSAUAUEsDBBQAAAAIAPJaVl1yU8XLCgAAAAgAAAAMAAAAYmluL25vZGUuZXhly8tPSdVLrUgFAFBLAwQUAAAACADyWlZdjdM4CwwAAAAKAAAADgAAAGJpbi95dC1kbHAuZXhlqyzRTckp0EutSAUAUEsDBBQAAAAIAPJaVl2tofV9EgAAABAAAAAUAAAAYmluL2xpYm1wM2xhbWUtMC5kbGzLyUzKLTDOScxN1TXQS8nJAQBQSwMEFAAAAAgA8lpWXRFKmu0VAAAAEwAAABcAAABiaW4vbGlid2lucHRocmVhZC0xLmRsbMvJTCrPzCsoyShKTUzRNdRLyckBAFBLAwQUAAAACADyWlZdGUzcnRIAAAAQAAAAEwAAAGxpY2Vuc2VzL05PVElDRS50eHTLL8pMz8xLzFHIyy/JTE4tBgBQSwMEFAAAAAgA8lpWXWKda9gPAAAADQAAABcAAABub2RlX21vZHVsZXMvbnBtL25wbS5qc8vLL1FIVMjJTE7NK04FAFBLAQIUABQAAAAIAPJaVl11A2gQDAAAAAoAAAAOAAAAAAAAAAAAAACAAQAAAABiaW4vZmZtcGVnLmV4ZVBLAQIUABQAAAAIAPJaVl0XERasDQAAAAsAAAAPAAAAAAAAAAAAAACAATgAAABiaW4vZmZwcm9iZS5leGVQSwECFAAUAAAACADyWlZdclPFywoAAAAIAAAADAAAAAAAAAAAAAAAgAFyAAAAYmluL25vZGUuZXhlUEsBAhQAFAAAAAgA8lpWXY3TOAsMAAAACgAAAA4AAAAAAAAAAAAAAIABpgAAAGJpbi95dC1kbHAuZXhlUEsBAhQAFAAAAAgA8lpWXa2h9X0SAAAAEAAAABQAAAAAAAAAAAAAAIAB3gAAAGJpbi9saWJtcDNsYW1lLTAuZGxsUEsBAhQAFAAAAAgA8lpWXRFKmu0VAAAAEwAAABcAAAAAAAAAAAAAAIABIgEAAGJpbi9saWJ3aW5wdGhyZWFkLTEuZGxsUEsBAhQAFAAAAAgA8lpWXRlM3J0SAAAAEAAAABMAAAAAAAAAAAAAAIABbAEAAGxpY2Vuc2VzL05PVElDRS50eHRQSwECFAAUAAAACADyWlZdYp1r2A8AAAANAAAAFwAAAAAAAAAAAAAAgAGvAQAAbm9kZV9tb2R1bGVzL25wbS9ucG0uanNQSwUGAAAAAAgACAD8AQAA8wEAAAAA','base64');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
async function fixture(){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'source-built-tools-'));
 const outputDir=path.join(root,'vendor');
 const artifact=path.join(root,'built.zip');await fs.writeFile(artifact,zip);
 const names=['ffmpeg.exe','ffprobe.exe','node.exe','yt-dlp.exe','libmp3lame-0.dll','libwinpthread-1.dll'];
 const tool={name:'ffmpeg',version:'local-test',format:'source-build',files:Object.fromEntries(names.map(n=>['bin/'+n,n])),license:'test LGPL'};
 const manifestPath=path.join(root,'tools.lock.json');await fs.writeFile(manifestPath,JSON.stringify({tools:[tool]}));
 const sources={};for(const name of ['ffmpeg.tar.gz','lame.tar.gz','ffmpeg-build.tar.gz']){await fs.writeFile(path.join(root,name),name);sources[name]={path:name,sha256:sha(name)};}
 return {root,outputDir,manifestPath,buildFromSource:()=>({directory:root,archive:{path:'built.zip',sha256:sha(zip)},sources})};
}
test('prepares source-built tools with all DLL hashes, notices and source archives',async()=>{
 const f=await fixture();
 try{
  await prepareTools(f);
  const hashes=JSON.parse(await fs.readFile(path.join(f.outputDir,'installed-hashes.json')));
  a.equal(hashes['libmp3lame-0.dll'],sha('libmp3lame-0.dll'));
  a.equal(hashes['libwinpthread-1.dll'],sha('libwinpthread-1.dll'));
  a.equal(await fs.readFile(path.join(f.outputDir,'sources/lame.tar.gz'),'utf8'),'lame.tar.gz');
  a.equal(await fs.readFile(path.join(f.outputDir,'licenses/ffmpeg/licenses/NOTICE.txt'),'utf8'),'original notices');
 }finally{await fs.rm(f.root,{recursive:true,force:true});}
});
test('a missing declared DLL preserves the previous tool installation',async()=>{
 const f=await fixture();
 try{
  const manifest=JSON.parse(await fs.readFile(f.manifestPath));manifest.tools[0].files['bin/missing.dll']='missing.dll';await fs.writeFile(f.manifestPath,JSON.stringify(manifest));
  await fs.mkdir(f.outputDir);await fs.writeFile(path.join(f.outputDir,'previous.txt'),'keep');
  await a.rejects(prepareTools(f),/ENOENT/);
  a.equal(await fs.readFile(path.join(f.outputDir,'previous.txt'),'utf8'),'keep');
 }finally{await fs.rm(f.root,{recursive:true,force:true});}
});
test('supplementary runtime source is installed only from its pinned bytes',async()=>{
 const f=await fixture();
 try{
  const manifest=JSON.parse(await fs.readFile(f.manifestPath));
  manifest.tools[0].additionalSources=[{filename:'runtime.tar.gz',url:'https://example.test/runtime.tar.gz',sha256:sha('runtime')}];
  await fs.writeFile(f.manifestPath,JSON.stringify(manifest));
  await fs.mkdir(path.join(f.root,'.downloads'),{recursive:true});await fs.writeFile(path.join(f.root,'.downloads',sha('runtime')),'runtime');
  await prepareTools(f);
  a.equal(await fs.readFile(path.join(f.outputDir,'sources/runtime.tar.gz'),'utf8'),'runtime');
 }finally{await fs.rm(f.root,{recursive:true,force:true});}
});

test('Node retains only selected notices and preserves the source archive filename',async()=>{
 const f=await fixture();
 try{
  const manifest=JSON.parse(await fs.readFile(f.manifestPath));const tool=manifest.tools[0];
  tool.name='node';tool.format='zip';tool.url='https://example.test/node.zip';tool.sha256=sha(zip);
  tool.noticeFiles=['licenses/NOTICE.txt'];tool.sourceUrl='https://example.test/node.tar.xz';tool.sourceSha256=sha('node source');tool.sourceFilename='node.tar.xz';
  await fs.writeFile(f.manifestPath,JSON.stringify(manifest));
  await fs.mkdir(path.join(f.root,'.downloads'),{recursive:true});
  await fs.writeFile(path.join(f.root,'.downloads',sha(zip)),zip);
  await fs.writeFile(path.join(f.root,'.downloads',sha('node source')),'node source');
  await prepareTools(f);
  a.equal(await fs.readFile(path.join(f.outputDir,'licenses/node/licenses/NOTICE.txt'),'utf8'),'original notices');
  await a.rejects(fs.access(path.join(f.outputDir,'licenses/node/node_modules/npm/npm.js')),/ENOENT/);
  a.equal(await fs.readFile(path.join(f.outputDir,'sources/node.tar.xz'),'utf8'),'node source');
  await a.rejects(fs.access(path.join(f.outputDir,'sources/node.tar.gz')),/ENOENT/);
 }finally{await fs.rm(f.root,{recursive:true,force:true});}
});

test('a material-stage failure preserves the previous complete vendor set',async()=>{const f=await fixture();try{await fs.mkdir(f.outputDir);await fs.writeFile(path.join(f.outputDir,'previous.txt'),'complete');await a.rejects(prepareTools({...f,materialPreparation:async()=>{throw Error('material hash failure')}}),/material hash/);a.equal(await fs.readFile(path.join(f.outputDir,'previous.txt'),'utf8'),'complete');}finally{await fs.rm(f.root,{recursive:true,force:true})}});
