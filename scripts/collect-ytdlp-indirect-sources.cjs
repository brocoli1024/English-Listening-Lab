const fs=require('fs'),path=require('path'),crypto=require('crypto');
const packages={cffi:'2.1.1',pycparser:'3.00',charset_normalizer:'3.5.0',idna:'3.18'};
(async()=>{
fs.mkdirSync('desktop/.downloads/compliance',{recursive:true});
fs.mkdirSync('docs/release/licenses',{recursive:true});
const cp=require('child_process');
const results=[];
for(const [name,version] of Object.entries(packages)){
 try{
  const response=await fetch(`https://pypi.org/pypi/${name}/${version}/json`,{signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw Error(`metadata HTTP ${response.status}`);
  const metadata=await response.json(),asset=metadata.urls.find(x=>x.packagetype==='sdist');
  if(!asset)throw Error('No source distribution');
  const file=path.join('desktop/.downloads/compliance',path.basename(asset.filename));
  let bytes=fs.existsSync(file)?fs.readFileSync(file):null;
  const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
  if(!bytes||digest(bytes)!==asset.digests.sha256){const r=await fetch(asset.url,{signal:AbortSignal.timeout(120000)});if(!r.ok)throw Error(`source HTTP ${r.status}`);bytes=Buffer.from(await r.arrayBuffer());if(digest(bytes)!==asset.digests.sha256)throw Error('Hash mismatch');fs.writeFileSync(file,bytes);}
  const entries=cp.execFileSync('tar',['-tf',file],{encoding:'utf8'}).split(/\r?\n/).filter(x=>/^[^/]+\/(?:LICENSE(?:\.[^/]+)?|COPYING(?:\.[^/]+)?|NOTICE(?:\.[^/]+)?)$/i.test(x));
  const licenseFiles=entries.map(entry=>{const out=path.join('docs/release/licenses',name+'-'+version+'-'+path.basename(entry));fs.writeFileSync(out,cp.execFileSync('tar',['-xOf',file,entry]));return out.replaceAll('\\','/');});
  results.push({name,version,licenseFiles,url:asset.url,sha256:asset.digests.sha256,file,status:'source-downloaded-hash-verified',review:'Transitive native dependencies and binary correspondence still require review'});
  console.log(`${name} ${version}: source hash verified`);
 }catch(e){results.push({name,version,status:'missing',reason:e.message});console.log(`${name}: ${e.message}`);}
}
fs.writeFileSync('docs/release/yt-dlp-indirect-sources.json',JSON.stringify({tool:'yt-dlp 2026.08.19 win_exe',versionEvidence:'Python 3.10.11 disassembly of bundled PYZ version assignments; see python-indirect-version-evidence.json',complete:false,packages:results},null,2)+'\n');
})().catch(e=>{console.error(e);process.exitCode=1});
