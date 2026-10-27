const fs=require('node:fs/promises');
const path=require('node:path');
const {spawn}=require('node:child_process');
async function main() {
  const development=process.argv[2]==='development';
  const executable=path.resolve(development?'node_modules/electron/dist/electron.exe':process.argv[2]||'release/win-unpacked/English Listening Lab.exe');
  const profile=path.resolve(process.argv[4]||'desktop/.test-data/packaged-smoke');
  const restarting=process.argv[3]==='restart';
  const fixtureSong = { id:'packaged-persistent', title:'Backup fixture', artist:'Test', difficulty:'Easy', accentColor:'#000', imported:true, synced:false, audioSource:{uri:'app://studio/audio/packaged-persistent'}, lyrics:[{timestamp:0,english:'Hello friendly world',chinese:'',blankedWords:[]}] };
  const fixtureStorage = {
    '@english-listening/imports-v1': JSON.stringify([fixtureSong]),
    '@english-listening/draft/packaged-persistent:rules-1:Easy': JSON.stringify({'0-0':'hello'}),
    '@english-listening/progress-v1': JSON.stringify({completedSongIds:['packaged-persistent'],bestAccuracyBySong:{'packaged-persistent':100},totalPractices:1,history:[{songId:'packaged-persistent',accuracy:100,answers:{'0-0':'hello'},correctAnswers:1,totalBlanks:1,completedAt:'2026-10-17T00:00:00Z'}]}),
  };
  const port=19346;
  const child=spawn(executable,[...(development?[path.resolve('desktop/main.cjs')]:[]),`--remote-debugging-port=${port}`,'--remote-debugging-address=127.0.0.1'],{windowsHide:true,stdio:'ignore',env:{...process.env,LISTENING_LAB_TEST_DATA_DIR:profile}});
  let socket;
  const pending=new Map();let id=0;
  const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  try {
    let target;
    for(let i=0;i<80;i++) {
      try {target=(await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(item=>item.type==='page' && item.url.startsWith('app://studio'));if(target)break;}catch{}
      await pause(250);
    }
    if(!target)throw Error('Packaged window did not start');
    socket=new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
    socket.addEventListener('message',event=>{const message=JSON.parse(event.data);const handler=pending.get(message.id);if(handler){pending.delete(message.id);message.error?handler.reject(Error(message.error.message)):handler.resolve(message.result);}});
    function send(method,params={}) {return new Promise((resolve,reject)=>{const messageId=++id;const timeout=setTimeout(()=>{pending.delete(messageId);reject(Error(`CDP timeout: ${method}`));},15000);pending.set(messageId,{resolve:value=>{clearTimeout(timeout);resolve(value);},reject:error=>{clearTimeout(timeout);reject(error);}});socket.send(JSON.stringify({id:messageId,method,params}));});}
    async function evaluate(expression){const value=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(value.exceptionDetails)throw Error(JSON.stringify(value.exceptionDetails));return value.result.value;}
    await pause(1600);
    const body=await evaluate('document.body.innerText');if(!/listening/i.test(body))throw Error('Application content missing');
    if (process.env.LISTENING_LAB_VERIFY_SUPPORT === '1') {
      const click = async text => {
        await evaluate(`(()=>{const button=[...document.querySelectorAll('[role="button"]')].find(el=>el.textContent===${JSON.stringify(text)});if(!button)throw Error('Missing support action');button.click();})()`);
        await pause(500);
      };
      await click('說明與支援');
      const support = await evaluate('document.body.innerText');
      for (const label of ['查看下載與版本紀錄（瀏覽器）','回報問題（瀏覽器）','完整隱私說明（瀏覽器）','資料與隱私']) if(!support.includes(label)) throw Error('Missing project support entry: '+label);
      await evaluate(`(async()=>{try{await window.listeningLab.openProjectPage('https://evil.invalid/');throw Error('Arbitrary URL accepted');}catch(error){if(!error.message.includes('專案頁面無效'))throw error;}})()`);
      for (const label of ['問題回報','備份與資料復原','授權與第三方通知','版本 '+require('../package.json').version]) if(!support.includes(label)) throw Error('Missing support content: '+label);
      await click('程式授權全文');
      if(!(await evaluate('document.body.innerText')).includes('Permission is hereby granted')) throw Error('App license missing');
      await click('第三方通知全文');
      if(!(await evaluate('document.body.innerText')).includes('sacabase')) throw Error('Current third-party notice missing');
      await click('第三方通知全文');
      const supportShot=await send('Page.captureScreenshot',{format:'png'});
      await click('Microsoft 元件附加條款');
      const terms=await evaluate('document.body.innerText');
      const expectedTerms=await fs.readFile(path.resolve('MICROSOFT_RUNTIME_TERMS.txt'),'utf8');
      const termsVersion=expectedTerms.match(/版本：[^\r\n]+/)?.[0];
      if(!termsVersion || !terms.includes(termsVersion) || !terms.includes('即表示你同意遵守本頁就 Microsoft 元件列出的使用與再散布保護條件') || !terms.includes('Microsoft 元件不因與開源軟體一起提供'))throw Error('Microsoft recipient terms missing');
      await click('Microsoft 元件附加條款');
      await fs.mkdir(profile,{recursive:true});await fs.writeFile(path.join(profile,'support.png'),Buffer.from(supportShot.data,'base64'));
      await click('返回首頁');
      console.log('PASS: support navigation, version, current license notices and return');
    }
    if(restarting) {
      await evaluate(`(async()=>{if(localStorage.getItem('packaged-smoke')!=='preserved')throw Error('Storage lost after process restart/update');await window.listeningLab.resolveAudio('packaged-persistent');})()`);
    } else {
      const bytes=await fs.readFile(path.resolve('assets/audio/twinkle-twinkle-vocal.wav'));
      await evaluate(`(async()=>{if(typeof window.require!=='undefined'||!window.listeningLab)throw Error('Bridge isolation failed');await window.listeningLab.removeAudio('packaged-persistent');await window.listeningLab.saveAudio('packaged-persistent',{kind:'bytes',name:'fixture.wav',bytes:Uint8Array.from(atob(${JSON.stringify(bytes.toString('base64'))}),c=>c.charCodeAt(0))});localStorage.setItem('packaged-smoke','preserved');})()`);
    }
    if (!restarting) await evaluate(`(()=>{for(const [key,value] of Object.entries(${JSON.stringify(fixtureStorage)}))localStorage.setItem(key,value);})()`);
    await evaluate(`(()=>{for(const [key,value] of Object.entries(${JSON.stringify(fixtureStorage)}))if(localStorage.getItem(key)!==value)throw Error('Library/draft/results mismatch: '+key);})()`);
    await send('Page.reload');await pause(1800);
    if(await evaluate("localStorage.getItem('packaged-smoke')")!=='preserved')throw Error('Packaged storage not preserved');
    if(restarting) await evaluate(`(async()=>{localStorage.removeItem('packaged-smoke');for(const key of Object.keys(${JSON.stringify(fixtureStorage)}))localStorage.removeItem(key);await window.listeningLab.removeAudio('packaged-persistent');})()`);
    const shot=await send('Page.captureScreenshot',{format:'png'});await fs.mkdir(profile,{recursive:true});await fs.writeFile(path.join(profile,'packaged.png'),Buffer.from(shot.data,'base64'));
    console.log(`PASS: packaged executable, restricted bridge, durable audio, ${restarting?'process restart/update persistence':'reload persistence'}`);
    await send('Browser.close').catch(()=>{});
  } finally {
    socket?.close();
    if(child.exitCode===null) {await Promise.race([new Promise(resolve=>child.once('exit',resolve)),pause(5000)]);if(child.exitCode===null)child.kill();}
  }
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
