const fs = require('node:fs/promises');
const path = require('node:path');
const {randomUUID,createHash} = require('node:crypto');
const extract = require('extract-zip');
const {execFileSync}=require('node:child_process');
const {verifyBytes,safeEntry,resolveTools} = require('../desktop/tools.cjs');
const {buildFFmpeg}=require('./ffmpeg-build.cjs');
async function prepareTools({manifestPath,outputDir,buildFromSource=buildFFmpeg,materialPreparation=async()=>{}}) {
  const manifest=JSON.parse(await fs.readFile(manifestPath,'utf8'));
  const parent=path.dirname(path.resolve(outputDir));
  const cache=path.join(parent,'.downloads');
  const staging=path.join(parent,`.staging-${randomUUID()}`);
  await fs.mkdir(cache,{recursive:true}); await fs.mkdir(staging,{recursive:true});
  async function download(url,hash,name) {
    if (!url.startsWith('https://') || /\/latest\//.test(url)) throw new Error('工具必須固定 HTTPS 版本。');
    const cached=path.join(cache,hash);
    let bytes;
    try {bytes=await fs.readFile(cached);verifyBytes(bytes,hash);} catch {
      console.log(`Downloading ${name}`);
      const head=await fetch(url,{method:'HEAD',signal:AbortSignal.timeout(60000)});
      if(!head.ok) throw new Error(`Download failed (${head.status}): ${name}`);
      const size=Number(head.headers.get('content-length'));
      if(!Number.isSafeInteger(size) || size<0 || size>512*1024*1024) throw new Error(`Unexpected download size: ${name}`);
      if(size>8*1024*1024 && head.headers.get('accept-ranges')==='bytes') {
        const parts=new Array(8);
        await Promise.all(parts.fill(null).map(async(_,index)=>{
          const start=Math.floor(size*index/8),end=Math.floor(size*(index+1)/8)-1;
          const response=await fetch(url,{headers:{Range:`bytes=${start}-${end}`},signal:AbortSignal.timeout(900000)});
          if(response.status!==206 || response.headers.get('content-range')!==`bytes ${start}-${end}/${size}`) throw new Error(`Invalid partial download: ${name}`);
          const part=Buffer.from(await response.arrayBuffer());
          if(part.length!==end-start+1) throw new Error(`Incomplete download: ${name}`);
          parts[index]=part;console.log(`${name}: part ${index+1}/8 verified length`);
        }));
        bytes=Buffer.concat(parts);
      } else {
        const response=await fetch(url,{signal:AbortSignal.timeout(900000)});
        if(!response.ok) throw new Error(`Download failed (${response.status}): ${name}`);
        const chunks=[];let length=0;
        for await(const chunk of response.body) {
          length+=chunk.length;
          if(length>512*1024*1024) throw new Error(`Download exceeds limit: ${name}`);
          chunks.push(Buffer.from(chunk));
        }
        bytes=Buffer.concat(chunks);
      }
      verifyBytes(bytes,hash);
      await fs.writeFile(cached,bytes);
    }
    return {bytes,cached};
  }
  try {
    const licenses=path.join(staging,'licenses');await fs.mkdir(licenses);
    for(const tool of manifest.tools) {
      let bytes,cached;
      if(tool.format==='source-build') {
        if(tool.name!=='ffmpeg') throw new Error('Unsupported source-built tool');
        const built=await buildFromSource({root:path.resolve(path.dirname(manifestPath),'..')});
        cached=path.join(built.directory,built.archive.path);
        bytes=await fs.readFile(cached);verifyBytes(bytes,built.archive.sha256);
        await fs.mkdir(path.join(staging,'sources'),{recursive:true});
        for(const [name,item] of Object.entries(built.sources)) {
          safeEntry(name);
          const content=await fs.readFile(path.join(built.directory,item.path));verifyBytes(content,item.sha256);
          await fs.writeFile(path.join(staging,'sources',name),content);
        }
        const {directory,...receipt}=built;
        await fs.writeFile(path.join(staging,'ffmpeg-build-receipt.json'),JSON.stringify(receipt,null,2));
      } else ({bytes,cached}=await download(tool.url,tool.sha256,tool.name));
      if(tool.format==='exe') await fs.writeFile(path.join(staging,'yt-dlp.exe'),bytes);
      else {
        const unpacked=path.join(staging,tool.name);await fs.mkdir(unpacked);
        await extract(cached,{dir:unpacked,onEntry:entry=>{
          safeEntry(entry.fileName);
          if(((entry.externalFileAttributes>>>16)&0o170000)===0o120000) throw new Error('Symbolic links are not permitted');
        }});
        for(const [from,to] of Object.entries(tool.files)) await fs.copyFile(path.join(unpacked,safeEntry(from)),path.join(staging,safeEntry(to)));
        // Retain all upstream documentation and licenses, excluding executables.
        async function collect(dir,relative='') {for(const item of await fs.readdir(dir,{withFileTypes:true})) {
          const next=path.join(dir,item.name), rel=path.join(relative,item.name);
          if(item.isDirectory()) await collect(next,rel);
          else if(!/\.(exe|dll)$/i.test(item.name)) {const out=path.join(licenses,tool.name,rel);await fs.mkdir(path.dirname(out),{recursive:true});await fs.copyFile(next,out);}
        }}
        if(tool.noticeFiles) {
          if(!Array.isArray(tool.noticeFiles) || !tool.noticeFiles.length)throw new Error('Explicit notice selection must not be empty');
          for(const name of tool.noticeFiles) {
            const relative=safeEntry(name),target=path.join(licenses,tool.name,relative);
            await fs.mkdir(path.dirname(target),{recursive:true});
            await fs.copyFile(path.join(unpacked,relative),target);
          }
        } else await collect(unpacked);
        await fs.rm(unpacked,{recursive:true,force:true});
      }
      if(tool.sourceSha256 && tool.format!=='source-build') {
        const source=await download(tool.sourceUrl,tool.sourceSha256,`${tool.name} source`);
        await fs.mkdir(path.join(staging,'sources'),{recursive:true});
        const sourceName=safeEntry(tool.sourceFilename||`${tool.name}.tar.gz`);
        if(sourceName.includes('/'))throw new Error('Source archive names must be flat');
        await fs.copyFile(source.cached,path.join(staging,'sources',sourceName));
        const licensePath=tool.sourceLicensePath || (tool.name==='yt-dlp'?'yt-dlp/LICENSE':tool.name==='deno'?'deno/LICENSE.md':null);
        if(licensePath) await fs.writeFile(path.join(licenses,`${tool.name}-LICENSE.txt`),execFileSync('tar',['-xOf',source.cached,'--',safeEntry(licensePath)],{windowsHide:true,maxBuffer:2*1024*1024}));
      }
      if(tool.buildSourceSha256) {
        const source=await download(tool.buildSourceUrl,tool.buildSourceSha256,`${tool.name} build source`);
        await fs.copyFile(source.cached,path.join(staging,'sources',`${tool.name}-build.tar.gz`));
      }
      for(const item of tool.additionalSources||[]) {
        const name=safeEntry(item.filename);
        if(name.includes('/'))throw new Error('Source archive names must be flat');
        const source=await download(item.url,item.sha256,`${tool.name} ${name}`);
        await fs.mkdir(path.join(staging,'sources'),{recursive:true});
        await fs.copyFile(source.cached,path.join(staging,'sources',name));
      }
    }
    await fs.copyFile(manifestPath,path.join(staging,'tools.lock.json'));
    await fs.writeFile(path.join(licenses,'NOTICE.txt'),manifest.tools.map(t=>`${t.name} ${t.version}\n${t.license}\n${t.sourceUrl}\n${t.redistributionStatus||''}\n`).join('\n'));
    resolveTools(staging);
    const installedFiles=new Set(['yt-dlp.exe','ffmpeg.exe','ffprobe.exe','node.exe']);
    for(const tool of manifest.tools) for(const name of Object.values(tool.files||{})) installedFiles.add(safeEntry(name));
    const hashes={};for(const name of installedFiles) hashes[name]=createHash('sha256').update(await fs.readFile(path.join(staging,name))).digest('hex');
    await fs.writeFile(path.join(staging,'installed-hashes.json'),JSON.stringify(hashes,null,2));
    await materialPreparation(staging);
    const old=path.join(parent,`.staging-old-${randomUUID()}`);
    try {await fs.rename(outputDir,old);} catch(error) {if(error.code!=='ENOENT') throw error;}
    try {await fs.rename(staging,outputDir);} catch(error) {await fs.rename(old,outputDir).catch(()=>{});throw error;}
    await fs.rm(old,{recursive:true,force:true});
    console.log('Verified desktop tools ready.');
  } finally {await fs.rm(staging,{recursive:true,force:true});}
}
module.exports={prepareTools};
if(require.main===module) prepareTools({manifestPath:path.resolve('desktop/tools.lock.json'),outputDir:path.resolve('desktop/vendor'),materialPreparation:outputDir=>require('./prepare-ytdlp-materials.cjs').prepareMaterials({root:path.resolve('.'),outputDir})}).catch(error=>{console.error(error.message);process.exitCode=1;});
