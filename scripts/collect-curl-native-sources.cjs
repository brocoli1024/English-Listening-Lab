const fs=require('fs'),cp=require('child_process'),path=require('path'),crypto=require('crypto');
const archive='desktop/.downloads/compliance/curl-impersonate-v2.0.0-source.tar.gz',prefix='lexiforest-curl-impersonate-ec41b71/';
const cmake=cp.execFileSync('tar',['-xOf',archive,prefix+'CMakeLists.txt'],{encoding:'utf8'}),vars={};
for(const m of cmake.matchAll(/set\((\w+) "([^"\n]*)"\)/g))vars[m[1]]=m[2].replace(/\$\{(\w+)\}/g,(_,k)=>vars[k]??'${'+k+'}');
const dir='desktop/.downloads/compliance/curl-native';fs.mkdirSync(dir,{recursive:true});
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{const entries=[];for(const name of ['ZLIB','ZSTD','BROTLI','BORINGSSL','NGHTTP2','NGTCP2','NGHTTP3','CURL']){
 const url=vars[name+'_URL'],expected=vars[name+'_URL_HASH'].replace('SHA256=',''),file=path.join(dir,name.toLowerCase()+(url.endsWith('.zip')?'.zip':url.endsWith('.bz2')?'.tar.bz2':'.tar.gz'));
 try{let b=fs.existsSync(file)?fs.readFileSync(file):null;if(!b||digest(b)!==expected){const r=await fetch(url,{signal:AbortSignal.timeout(240000)});if(!r.ok)throw Error('HTTP '+r.status);b=Buffer.from(await r.arrayBuffer());if(digest(b)!==expected)throw Error('Upstream SHA256 mismatch');fs.writeFileSync(file,b);}
 const list=cp.execFileSync('tar',['-tf',file],{encoding:'utf8',maxBuffer:32*1024*1024}).split(/\r?\n/);const licenses=list.filter(n=>/^[^/]+\/(?:LICENSE[^/]*|COPYING[^/]*|NOTICE[^/]*|COPYRIGHT[^/]*)$/i.test(n)&&!n.endsWith('/'));const licenseFiles=[];
 for(const entry of licenses){const out='docs/release/licenses/'+name.toLowerCase()+'-'+(vars[name+'_VERSION']||vars[name+'_COMMIT'])+'-'+path.basename(entry);fs.writeFileSync(out,cp.execFileSync('tar',['-xOf',file,entry],{maxBuffer:8*1024*1024}));licenseFiles.push(out);}
 entries.push({name,version:vars[name+'_VERSION']||vars[name+'_COMMIT'],url,sha256:expected,file,licenseFiles,status:'upstream-hash-verified'});console.log(name+': source hash verified; '+licenses.length+' top-level license files');
 }catch(e){entries.push({name,url,sha256:expected,status:'missing',reason:e.message});console.log(name+': '+e.message);}
 fs.writeFileSync('docs/release/curl-native-sources.json',JSON.stringify({sourceCommit:'ec41b71ce888806bfec56ada7a7258d333eb3d19',hashEvidence:'CMakeLists.txt at fixed source commit',scope:'Windows libcurl native dependency source archives; not a rebuild or whole-app distribution clearance',entries},null,2)+'\n');
}})().catch(e=>{console.error(e);process.exitCode=1});
