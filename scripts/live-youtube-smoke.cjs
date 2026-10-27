// Optional network integration test; never run by normal tests or CI.
// Fixture: Big Buck Bunny, (c) 2008 Blender Foundation / www.bigbuckbunny.org.
// CC BY 3.0: https://peach.blender.org/about/
// No fixture audio is distributed or added to the application library.
const path=require('node:path');
const fs=require('node:fs/promises');
const {createJobManager}=require('../desktop/jobs.cjs');
const {resolveTools}=require('../desktop/tools.cjs');
const {runProcess}=require('../desktop/process-runner.cjs');
async function main() {
  const root=path.resolve('desktop/.test-data/live-download');
  const tools=resolveTools(path.resolve('desktop/vendor'));
  let last='';
  const jobs=createJobManager({tools,tempRoot:root,onProgress:(_owner,event)=>{
    const label=event.stage+(event.percent===undefined?'':` ${Math.floor(event.percent/10)*10}%`);
    if(label!==last){console.log(label);last=label;}
  }});
  try {
    const {jobId}=jobs.start('aqz-KE-bpKQ',1);
    const result=await jobs.wait(jobId,1);
    const source=await jobs.source(result.audioToken,1);
    const probe=await runProcess(tools.ffprobe,['-v','error','-show_entries','format=duration:stream=codec_name','-of','json',source],{timeoutMs:30000});
    const metadata=JSON.parse(probe.stdout);
    if(!metadata.streams.some(stream=>stream.codec_name==='mp3') || Number(metadata.format.duration)<600) throw Error('Downloaded audio verification failed');
    console.log(JSON.stringify({status:'PASS',bytes:result.audioBytes,subtitleKind:result.subtitleKind,duration:Number(metadata.format.duration)}));
    await jobs.release(jobId,1);
    if((await fs.readdir(root)).length) throw Error('Temporary download was not cleaned');
  } finally {await jobs.shutdown();}
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
