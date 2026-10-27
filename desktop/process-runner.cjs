const {spawn} = require('node:child_process');
const path = require('node:path');
const {StringDecoder}=require('node:string_decoder');
function runProcess(executable,args,{cwd,timeoutMs=600000,signal,onLine,maxOutput=8*1024*1024} = {}) {
  return new Promise((resolve,reject) => {
    if (signal?.aborted) return reject(new Error('已取消下載。'));
    const child = spawn(executable,args,{cwd,shell:false,windowsHide:true,stdio:['ignore','pipe','pipe'],detached:process.platform !== 'win32'});
    let stdout = '', count = 0, failure, killing;
    const streams={out:{decoder:new StringDecoder('utf8'),pending:''},err:{decoder:new StringDecoder('utf8'),pending:''}};
    function stop(message) {
      if (failure) return;
      failure = new Error(message);
      if (!child.pid) return;
      if (process.platform === 'win32') {
        killing = new Promise(done => {
          const killer = spawn(path.join(process.env.SystemRoot || 'C:\\Windows','System32','taskkill.exe'),['/PID',String(child.pid),'/T','/F'],{windowsHide:true,shell:false,stdio:'ignore'});
          killer.once('error',() => {child.kill(); done();});
          killer.once('close',code=>{if(code!==0) child.kill();done();});
        });
      } else {try {process.kill(-child.pid,'SIGKILL');} catch {child.kill('SIGKILL');}}
    }
    const abort = () => stop('已取消下載。');
    signal?.addEventListener('abort',abort,{once:true});
    const timer = setTimeout(() => stop('處理超過時間限制，請重試。'),timeoutMs);
    function output(chunk,isStdout) {
      count += chunk.length;
      if (count > maxOutput) {stop('工具輸出超過限制。'); return;}
      const stream=streams[isStdout?'out':'err'];
      const text=stream.decoder.write(chunk);
      if (isStdout) stdout += text;
      stream.pending += text;
      const lines = stream.pending.split(/[\r\n]+/); stream.pending = lines.pop();
      for (const line of lines) onLine?.(line);
    }
    child.stdout.on('data',chunk => output(chunk,true));
    child.stderr.on('data',chunk => output(chunk,false));
    child.once('error',() => {failure = new Error('無法啟動內附工具，請重新安裝桌面版。');});
    child.once('close',async code => {
      clearTimeout(timer); signal?.removeEventListener('abort',abort);
      stdout+=streams.out.decoder.end();
      if (killing) await killing;
      if (failure) reject(failure);
      else if (code !== 0) reject(new Error('下載未完成。請確認影片公開、網路連線，或更新桌面版後重試。'));
      else resolve({stdout});
    });
  });
}
module.exports = {runProcess};
