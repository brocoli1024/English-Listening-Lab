const fs=require('node:fs'),path=require('node:path'),{createHash,randomUUID}=require('node:crypto');
async function prepareMaterials({root=path.resolve(__dirname,'..'),outputDir=path.join(root,'desktop/vendor'),fetchImpl=fetch}={}) {
  const lock=JSON.parse(fs.readFileSync(path.join(root,'desktop/yt-dlp-materials.lock.json'),'utf8'));
  if(!path.resolve(outputDir).startsWith(path.resolve(root)+path.sep))throw Error('Material output escapes root');
  const dest=path.join(outputDir,'sources');fs.mkdirSync(dest,{recursive:true});const names=new Set();
  for(const item of lock.inputs) {
    if(!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(item.filename)||names.has(item.filename))throw Error('Invalid or duplicate material filename');names.add(item.filename);
    if(!/^[a-f0-9]{64}$/.test(item.sha256)||!item.url.startsWith('https://')||item.url.includes('/latest/'))throw Error('Invalid pinned material');
    const digest=b=>createHash('sha256').update(b).digest('hex');let bytes;
    for(const file of [item.cachePath&&path.resolve(root,item.cachePath),path.join(dest,item.filename)].filter(Boolean)) {if(!file.startsWith(path.resolve(root)+path.sep))throw Error('Material cache escapes root');if(fs.existsSync(file)){const b=fs.readFileSync(file);if(digest(b)===item.sha256){bytes=b;break}}}
    if(!bytes){const response=await fetchImpl(item.url,{signal:AbortSignal.timeout(180000)});if(!response.ok)throw Error('Material download failed: '+item.filename);bytes=Buffer.from(await response.arrayBuffer());}
    if(digest(bytes)!==item.sha256)throw Error('Material SHA-256 mismatch: '+item.filename);
    const target=path.join(dest,item.filename);if(fs.existsSync(target)&&digest(fs.readFileSync(target))===item.sha256)continue;
    const temp=path.join(dest,'.material-'+randomUUID());try{fs.writeFileSync(temp,bytes);fs.renameSync(temp,target)}finally{if(fs.existsSync(temp))fs.unlinkSync(temp)}
  }
  console.log(`Verified yt-dlp material inputs ready: ${lock.inputs.length}`);
}
if(require.main===module)prepareMaterials().catch(e=>{console.error(e);process.exitCode=1});
module.exports={prepareMaterials};
