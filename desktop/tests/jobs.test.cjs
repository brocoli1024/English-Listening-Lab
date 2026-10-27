const {test} = require('node:test');
const a = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const {runProcess} = require('../process-runner.cjs');
const {createJobManager} = require('../jobs.cjs');

test('inspection, audio and caption requests use only bundled Node with remote components disabled',async t=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'node-jobs-'));
  t.after(()=>fs.rm(root,{recursive:true,force:true}));
  const calls=[];
  const runner=async(_exe,args,opts)=>{
    calls.push(args);
    if(args.includes('--dump-single-json'))return {stdout:JSON.stringify({id:'abcdefghijk',duration:20,title:'Demo',subtitles:{en:[{ext:'json3'}]}})};
    if(args.includes('--write-subs'))await fs.writeFile(path.join(opts.cwd,'captions.en.json3'),JSON.stringify({events:[{tStartMs:0,segs:[{utf8:'Hello'}]}]}));
    else await fs.writeFile(path.join(opts.cwd,'audio.mp3'),'audio');
    return {stdout:''};
  };
  const jobs=createJobManager({tools:{ytDlp:'yt',ffmpeg:'ffmpeg',node:'C:\\中文 folder\\node.exe'},tempRoot:root,runner});
  await jobs.inspect('https://youtu.be/abcdefghijk',1);
  const {jobId}=jobs.start('abcdefghijk',1);const result=await jobs.wait(jobId,1);
  a.ok(result.lrc);a.equal(calls.length,4);
  for(const args of calls){
    a.equal(args[args.indexOf('--js-runtimes')+1],'node:C:\\中文 folder\\node.exe');
    for(const flag of ['--ignore-config','--no-plugin-dirs','--no-remote-components','--no-js-runtimes'])a.ok(args.includes(flag));
    a.ok(!args.some(arg=>arg.startsWith('deno:')));
  }
  await jobs.release(jobId,1);await jobs.shutdown();
});
test('real subprocess completes, bounds output and can be cancelled', async () => {
  a.equal((await runProcess(process.execPath,['-e','console.log("hello")'])).stdout.trim(),'hello');
  await a.rejects(runProcess(process.execPath,['-e','process.stdout.write("x".repeat(200000))'],{maxOutput:1024}));
  await a.rejects(runProcess(process.execPath,['-e','setInterval(()=>{},1000)'],{timeoutMs:100}));
  const controller = new AbortController();
  const pending = runProcess(process.execPath,['-e','setInterval(()=>{},1000)'],{signal:controller.signal});
  controller.abort();
  await a.rejects(pending);
});
test('metadata preserves UTF-8 split across process chunks',async()=>{
  const result=await runProcess(process.execPath,['-e','const b=Buffer.from("中文");process.stdout.write(b.subarray(0,1));setTimeout(()=>process.stdout.write(b.subarray(1)),50)']);
  a.equal(result.stdout,'中文');
});
test('cancelling a tool also terminates its child process',async()=>{
  const controller=new AbortController();let descendant;
  await a.rejects(runProcess(process.execPath,['-e','const c=require("node:child_process").spawn(process.execPath,["-e","setInterval(()=>{},1000)"],{stdio:"ignore",windowsHide:true});console.log(c.pid);setInterval(()=>{},1000)'],{signal:controller.signal,timeoutMs:5000,onLine:line=>{descendant=Number(line);controller.abort();}}));
  a.ok(descendant>0);a.throws(()=>process.kill(descendant,0));
});
test('jobs enforce ownership, keep retry source and release temporary files', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(),'jobs 中文 '));
  t.after(() => fs.rm(root,{recursive:true,force:true}));
  const runner = async (_exe,args,opts) => {
    if(args.includes('--dump-single-json')) return {stdout:JSON.stringify({id:'abcdefghijk',title:'Demo',duration:20})};
    await fs.writeFile(path.join(opts.cwd,'audio.mp3'),'audio');
    return {stdout:''};
  };
  const jobs = createJobManager({tools:{ytDlp:'tool',ffmpeg:'ffmpeg',node:'node'},tempRoot:root,runner});
  const {jobId} = jobs.start('abcdefghijk',1);
  a.throws(() => jobs.start('abcdefghijk',1));
  await a.rejects(jobs.wait(jobId,2));
  const result = await jobs.wait(jobId,1);
  a.equal(result.lrc,null);
  a.equal(result.audioBytes,5);
  a.equal(await fs.readFile(await jobs.source(result.audioToken,1),'utf8'),'audio');
  await a.rejects(jobs.source(result.audioToken,2));
  await jobs.release(jobId,1);
  await a.rejects(jobs.source(result.audioToken,1));
  await jobs.shutdown();
});
test('failed inspection is retryable and shutdown aborts active inspection',async t=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'inspect-'));
  t.after(()=>fs.rm(root,{recursive:true,force:true}));
  let attempts=0;
  const jobs=createJobManager({tools:{ytDlp:'tool',ffmpeg:'ffmpeg',node:'node'},tempRoot:root,runner:async(_exe,_args,{signal})=>{
    if(attempts++===0) throw Error('network');
    return new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(Error('cancel')),{once:true}));
  }});
  await a.rejects(jobs.inspect('https://youtu.be/abcdefghijk',1));
  const pending=jobs.inspect('https://youtu.be/abcdefghijk',1);
  const rejected=a.rejects(pending);
  await jobs.shutdown(); await rejected;
});
test('inspection can be cancelled by its owner and retried immediately',async t=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'cancel-inspect-'));
  t.after(()=>fs.rm(root,{recursive:true,force:true}));
  const jobs=createJobManager({tools:{ytDlp:'tool',ffmpeg:'ffmpeg',node:'node'},tempRoot:root,runner:async(_exe,_args,{signal})=>new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(Error('cancel')),{once:true}))});
  const first=a.rejects(jobs.inspect('https://youtu.be/abcdefghijk',1));
  await a.rejects(jobs.cancel('inspection',2));
  await jobs.cancel('inspection',1);await first;
  const retry=a.rejects(jobs.inspect('https://youtu.be/abcdefghijk',1),/cancel/);
  await jobs.cancel('inspection',1);await retry;
  await jobs.shutdown();
});
