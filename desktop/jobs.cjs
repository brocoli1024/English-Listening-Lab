const fs = require('node:fs/promises');
const path = require('node:path');
const {randomUUID} = require('node:crypto');
const {normalizeYouTubeUrl,parseVideoInfo} = require('./youtube.cjs');
const {normalizeCaptions} = require('./subtitles.cjs');
const {runProcess} = require('./process-runner.cjs');
const {validFile,MAX_AUDIO} = require('./audio-store.cjs');
function createJobManager({tools,tempRoot,runner=runProcess,onProgress=()=>{},timeoutMs=600000}) {
  const jobs = new Map();
  let busy = false, closed = false, inspecting;
  const root = path.resolve(tempRoot);
  const base = () => ['--ignore-config','--no-plugin-dirs','--no-playlist','--no-remote-components','--no-cache-dir','--no-js-runtimes','--js-runtimes',`node:${tools.node}`,'--ffmpeg-location',path.dirname(tools.ffmpeg),'--socket-timeout','20','--retries','2'];
  async function metadata(url,signal,cwd) {
    const output = await runner(tools.ytDlp,[...base(),'--skip-download','--dump-single-json','--',url],{signal,cwd,timeoutMs:Math.min(timeoutMs,60000)});
    return parseVideoInfo(JSON.parse(output.stdout));
  }
  const owned = (id,owner) => {const job=jobs.get(id); if(!job || job.owner !== owner) throw new Error('找不到這個匯入工作。'); return job;};
  const progress = (job,stage,extra={}) => onProgress(job.owner,{jobId:job.id,stage,...extra});
  async function clear(job) {await fs.rm(job.dir,{recursive:true,force:true});}
  return {
    async inspect(input,owner) {
      if (busy || closed) throw new Error('請先完成或取消目前的下載。');
      const {url} = normalizeYouTubeUrl(input);
      busy = true;
      const controller = new AbortController();
      const promise = metadata(url,controller.signal);
      inspecting = {controller,promise,owner};
      try {return await promise;} finally {busy=false; inspecting=undefined;}
    },
    start(videoId,owner) {
      if (busy || closed || jobs.size) throw new Error('請先完成或取消目前的匯入。');
      if (typeof videoId !== 'string' || !/^[\w-]{11}$/.test(videoId)) throw new Error('影片識別碼無效。');
      const job = {id:randomUUID(),token:randomUUID(),owner,controller:new AbortController()};
      job.dir = path.join(root,job.id);
      jobs.set(job.id,job); busy=true;
      job.promise = (async () => {
        let monitor;
        const deadline = setTimeout(() => job.controller.abort(),timeoutMs);
        try {
          await fs.mkdir(job.dir,{recursive:true});
          progress(job,'checking');
          const url = `https://www.youtube.com/watch?v=${videoId}`;
          const info = await metadata(url,job.controller.signal,job.dir);
          if(job.controller.signal.aborted) throw new Error('已取消下載。');
          progress(job,'downloading');
          // Bound disk use as conversion temporarily keeps both source and output.
          monitor = setInterval(async () => {
            try {const names=await fs.readdir(job.dir); let total=0; for(const name of names) total+=(await fs.lstat(path.join(job.dir,name))).size; if(total>MAX_AUDIO*3) job.controller.abort();} catch { /* cleanup may already have run */ }
          },250);
          const args = [...base(),'-f','bestaudio','--max-filesize',String(MAX_AUDIO),'--extract-audio','--audio-format','mp3','--audio-quality','128K','--newline','-o','audio.%(ext)s'];
          await runner(tools.ytDlp,[...args,'--',url],{cwd:job.dir,signal:job.controller.signal,timeoutMs,onLine:line => {
            if (line.includes('[ExtractAudio]')) progress(job,'converting');
            const percent = /\[download\]\s+(\d+(?:\.\d+)?)%/.exec(line);
            if (percent) progress(job,'downloading',{percent:Math.min(100,Number(percent[1]))});
          }});
          const audio = path.join(job.dir,'audio.mp3');
          const stat = await validFile(audio);
          let lrc = null;
          if (info.subtitleLanguage) {
            progress(job,'subtitles');
            try {
              await runner(tools.ytDlp,[...base(),'--skip-download',info.subtitleKind==='manual'?'--write-subs':'--write-auto-subs','--sub-langs',info.subtitleLanguage,'--sub-format','json3','-o','captions.%(ext)s','--',url],{cwd:job.dir,signal:job.controller.signal,timeoutMs});
              const filename = (await fs.readdir(job.dir)).find(name => /^captions\.[\w.-]+\.json3$/.test(name));
              if (filename) {
                const file = path.join(job.dir,filename);
                const subtitleStat=await fs.lstat(file);
                if (subtitleStat.isFile() && !subtitleStat.isSymbolicLink() && subtitleStat.size<=4*1024*1024) lrc=normalizeCaptions(JSON.parse(await fs.readFile(file,'utf8')));
              }
            } catch { /* Keep completed audio; the user can supply their own lyrics. */ }
          }
          if(job.controller.signal.aborted) throw new Error('已取消或超過處理時間，請重試。');
          job.audio=audio;
          progress(job,'ready');
          return {jobId:job.id,audioToken:job.token,audioName:`${info.title}.mp3`,audioBytes:stat.size,title:info.title,lrc,subtitleKind:lrc ? info.subtitleKind : 'none'};
        } catch(error) {
          progress(job,job.controller.signal.aborted?'cancelled':'failed');
          await clear(job); throw error;
        } finally {clearTimeout(deadline); clearInterval(monitor); busy=false;}
      })();
      job.promise.catch(()=>{});
      return {jobId:job.id};
    },
    async wait(id,owner) {return owned(id,owner).promise;},
    async cancel(id,owner) {
      if(id==='inspection') {
        if(!inspecting) return;
        const current=inspecting;
        if(current.owner!==owner) throw new Error('找不到這個匯入工作。');
        current.controller.abort();await current.promise.catch(()=>{});return;
      }
      const job=owned(id,owner); job.controller.abort(); await job.promise.catch(()=>{}); await clear(job); jobs.delete(id);
    },
    async release(id,owner) {return this.cancel(id,owner);},
    async source(token,owner) {const job=[...jobs.values()].find(j=>j.token===token && j.owner===owner && j.audio && !j.controller.signal.aborted); if(!job) throw new Error('下載音檔已失效，請重新匯入。'); await validFile(job.audio); return job.audio;},
    async shutdown() {
      closed=true;
      if(inspecting) {const current=inspecting; current.controller.abort(); await current.promise.catch(()=>{});}
      await Promise.all([...jobs.values()].map(job => this.cancel(job.id,job.owner)));
    },
  };
}
module.exports = {createJobManager};
